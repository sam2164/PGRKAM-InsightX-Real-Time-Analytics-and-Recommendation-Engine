# insightx/ml/recommender.py

from collections import defaultdict, Counter
from math import sqrt, log
from typing import List, Dict, Optional, Tuple

from django.apps import apps

from jobs.models import Job


def _get_jobinteraction_model():
    """
    Try to load jobs.JobInteraction dynamically.
    If it doesn't exist, return None so the engine can gracefully fall back.
    """
    try:
        return apps.get_model("jobs", "JobInteraction")
    except LookupError:
        return None


def _parse_skills(skills_str: str) -> set:
    if not skills_str:
        return set()
    return {s.strip().lower() for s in skills_str.split(",") if s.strip()}


def _event_weight(event_value: str) -> float:
    """
    Map interaction events to implicit rating weights.

    NOTE: we assume the interaction model has a field named `event`
    with values like 'view', 'bookmark', 'apply', etc.
    If you later name it differently, just update this function.
    """
    if not event_value:
        return 1.0

    ev = str(event_value).lower().strip()
    if ev in ("view", "viewed"):
        return 1.0
    if ev in ("bookmark", "saved", "save"):
        return 2.0
    if ev in ("apply", "applied"):
        return 3.0
    if ev in ("hired", "shortlisted", "selected"):
        return 4.0

    # default small positive signal
    return 1.0


# -------------------------------------------------------------------
# COLLABORATIVE FILTERING CORE (user–user similarity)
# -------------------------------------------------------------------

def _build_user_job_matrix():
    """
    Build:
      - user_job_ratings: {user_id: {job_id: rating}}
      - job_popularity: {job_id: count_interactions}

    If there is no JobInteraction model yet, we just return
    empty interactions and zero popularity (engine will fall back).
    """
    JobInteraction = _get_jobinteraction_model()
    user_job_ratings: Dict[int, Dict[int, float]] = defaultdict(dict)
    job_popularity: Counter = Counter()

    if JobInteraction is None:
        # No interactions table yet – we can't do CF.
        # Popularity and CF parts will be zero; rule-based parts still work.
        return user_job_ratings, job_popularity

    interactions = JobInteraction.objects.select_related("job").all()

    for inter in interactions:
        user_id = inter.user_id
        job_id = inter.job_id
        w = _event_weight(getattr(inter, "event", ""))

        # accumulate weight (user may interact multiple times)
        user_job_ratings[user_id][job_id] = user_job_ratings[user_id].get(job_id, 0.0) + w
        job_popularity[job_id] += 1

    return user_job_ratings, job_popularity


def _cosine_sim(a: Dict[int, float], b: Dict[int, float]) -> float:
    """
    Cosine similarity between two sparse rating vectors: dict[job_id] -> rating.
    """
    if not a or not b:
        return 0.0

    common_jobs = set(a.keys()) & set(b.keys())
    if not common_jobs:
        return 0.0

    dot = sum(a[j] * b[j] for j in common_jobs)
    norm_a = sqrt(sum(v * v for v in a.values()))
    norm_b = sqrt(sum(v * v for v in b.values()))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


def _user_based_cf_scores(
    target_user_id: int,
    user_job_ratings: Dict[int, Dict[int, float]],
) -> Dict[int, float]:
    """
    Predict scores for jobs the target user has NOT interacted with, using
    user–user collaborative filtering (cosine similarity).
    """
    if target_user_id not in user_job_ratings:
        return {}

    target_ratings = user_job_ratings[target_user_id]

    # compute similarity to all other users
    similarities: Dict[int, float] = {}
    for other_uid, other_ratings in user_job_ratings.items():
        if other_uid == target_user_id:
            continue
        sim = _cosine_sim(target_ratings, other_ratings)
        if sim > 0:
            similarities[other_uid] = sim

    if not similarities:
        return {}

    # predict scores
    predicted: Dict[int, float] = defaultdict(float)
    norm: Dict[int, float] = defaultdict(float)

    for other_uid, sim in similarities.items():
        for job_id, rating in user_job_ratings[other_uid].items():
            if job_id in target_ratings:
                continue  # already interacted
            predicted[job_id] += sim * rating
            norm[job_id] += abs(sim)

    for job_id in list(predicted.keys()):
        if norm[job_id] > 0:
            predicted[job_id] /= norm[job_id]
        else:
            predicted[job_id] = 0.0

    return predicted


# -------------------------------------------------------------------
# GENETIC-ALGORITHM STYLE WEIGHT OPTIMIZATION
# -------------------------------------------------------------------

def _normalize_weights(w: Tuple[float, float, float]) -> Tuple[float, float, float]:
    s = sum(max(x, 0.0) for x in w)
    if s == 0:
        return 0.5, 0.25, 0.25
    return tuple(max(x, 0.0) / s for x in w)


def _ga_optimize_weights(
    positive_job_ids: List[int],
    job_features: Dict[int, Dict[str, float]],
    generations: int = 10,
    population_size: int = 20,
) -> Tuple[float, float, float]:
    """
    Simple genetic algorithm to optimize weights for:
      - skill_overlap
      - popularity
      - cf_score

    Fitness is average combined score of jobs the user already liked
    (positive_job_ids). This "pushes" the system to learn weights that
    score those jobs higher.
    """
    import random

    if not positive_job_ids:
        return 0.5, 0.25, 0.25

    # initialize population
    population = []
    for _ in range(population_size):
        w1, w2, w3 = random.random(), random.random(), random.random()
        population.append(_normalize_weights((w1, w2, w3)))

    def fitness(weights: Tuple[float, float, float]) -> float:
        w_skill, w_pop, w_cf = weights
        scores = []
        for jid in positive_job_ids:
            feats = job_features.get(jid)
            if not feats:
                continue
            s = (
                w_skill * feats.get("skill_overlap", 0.0)
                + w_pop * feats.get("popularity", 0.0)
                + w_cf * feats.get("cf_score", 0.0)
            )
            scores.append(s)
        if not scores:
            return 0.0
        return sum(scores) / len(scores)

    for _ in range(generations):
        # evaluate
        scored_pop = [(fitness(w), w) for w in population]
        scored_pop.sort(reverse=True, key=lambda x: x[0])

        # keep top 5 as elites
        elites = [w for _, w in scored_pop[:5]]

        # generate new population
        new_pop = elites[:]
        while len(new_pop) < population_size:
            parent = random.choice(elites)
            # mutation
            noise = (random.uniform(-0.1, 0.1),
                     random.uniform(-0.1, 0.1),
                     random.uniform(-0.1, 0.1))
            child = _normalize_weights(tuple(p + n for p, n in zip(parent, noise)))
            new_pop.append(child)

        population = new_pop

    # best weights
    final_scored = [(fitness(w), w) for w in population]
    final_scored.sort(reverse=True, key=lambda x: x[0])
    best_weights = final_scored[0][1]
    return best_weights


# -------------------------------------------------------------------
# MAIN API
# -------------------------------------------------------------------

def recommend_jobs_for_user(user_id: Optional[int], top_n: int = 10) -> List[Dict]:
    """
    AI-powered recommendation engine with:
      - collaborative filtering (user–user) when interactions exist
      - content-based skill overlap
      - popularity
      - GA-optimized scoring weights (when user has positive history)
    """
    # 1) basic data
    all_jobs = list(Job.objects.all())
    if not all_jobs:
        return []

    user_job_ratings, job_popularity = _build_user_job_matrix()

    # 2) collaborative filtering scores for this user
    if user_id is not None and user_job_ratings:
        cf_scores = _user_based_cf_scores(user_id, user_job_ratings)
    else:
        cf_scores = {}

    # 3) build a "user skill profile" from jobs they've interacted with
    user_skill_profile: set = set()
    positive_job_ids: List[int] = []

    if user_id is not None and user_id in user_job_ratings:
        for jid, rating in user_job_ratings[user_id].items():
            job = next((j for j in all_jobs if j.id == jid), None)
            if not job:
                continue
            job_skill_set = _parse_skills(job.skills)
            # weighting by rating
            if rating >= 2.0:
                user_skill_profile |= job_skill_set
                positive_job_ids.append(jid)

    # 4) precompute job features
    job_features: Dict[int, Dict[str, float]] = {}

    # popularity normalization
    if job_popularity:
        max_pop = max(job_popularity.values())
    else:
        max_pop = 0

    for job in all_jobs:
        jid = job.id
        job_skill_set = _parse_skills(job.skills)

        # skill overlap
        if user_skill_profile and job_skill_set:
            overlap = len(user_skill_profile & job_skill_set) / max(len(job_skill_set), 1)
        else:
            overlap = 0.0

        # popularity
        if max_pop > 0:
            pop_raw = job_popularity.get(jid, 0)
            popularity = log(1 + pop_raw) / log(1 + max_pop)
        else:
            popularity = 0.0  # no interaction data yet

        # collaborative filtering score
        cf_score = cf_scores.get(jid, 0.0)

        job_features[jid] = {
            "skill_overlap": overlap,
            "popularity": popularity,
            "cf_score": cf_score,
        }

    # 5) choose weights (GA if we have any positive history)
    if positive_job_ids:
        w_skill, w_pop, w_cf = _ga_optimize_weights(positive_job_ids, job_features)
    else:
        # no user history – generic scoring, lean on popularity (if any) + cf
        w_skill, w_pop, w_cf = 0.3, 0.4, 0.3

    # 6) compute final scores
    results = []

    for job in all_jobs:
        jid = job.id
        feats = job_features.get(jid, {})
        skill_overlap = feats.get("skill_overlap", 0.0)
        popularity = feats.get("popularity", 0.0)
        cf_score = feats.get("cf_score", 0.0)

        combined = (
            w_skill * skill_overlap +
            w_pop * popularity +
            w_cf * cf_score
        )

        success_score = round(100 * combined, 2)

        # try to read company/location fields safely
        company = getattr(job, "company", "") or ""
        location = getattr(job, "location", "") or ""

        results.append({
            "job_id": jid,
            "title": job.title,
            "company": company,
            "location": location,
            "skills": job.skills or "",
            "skill_overlap": round(skill_overlap * 100, 2),
            "popularity": round(popularity * 100, 2),
            "cf_score": round(cf_score, 3),
            "success_score": success_score,
        })

    # 7) sort and return top_n
    results.sort(key=lambda x: x["success_score"], reverse=True)
    return results[:top_n]