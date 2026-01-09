# insightx/ml/ai_recommender/hybrid_recommender.py
from django.db import models
from jobs.models import Job, JobInteraction
from .ga_optimizer import optimize_weights
from .similarity_engine import build_user_job_matrix, compute_cf_scores

# ---------- Cache GA weights once ----------
try:
    W_SKILL, W_CF, W_POP = optimize_weights()
except Exception as e:
    print("⚠️ GA optimize_weights failed, using defaults. Reason:", repr(e))
    W_SKILL, W_CF, W_POP = 0.4, 0.4, 0.2  # sensible defaults


def recommend_jobs_hybrid(user_id, top_n=10):
    """
    Hybrid Recommendation Engine:
      - Skill Match
      - Collaborative Filtering
      - Popularity Score
      - GA-Optimized Weighting
    """

    jobs = list(Job.objects.all())
    if not jobs:
        return []

    # Use cached weights
    w_skill, w_cf, w_pop = W_SKILL, W_CF, W_POP

    # Build user-job matrix + compute CF scores (you can later cache this too)
    user_job_matrix, user_ids, job_ids = build_user_job_matrix()
    cf_scores = compute_cf_scores(user_id, user_job_matrix, user_ids, job_ids)

    popularity_map = (
        JobInteraction.objects.values("job_id")
        .annotate(count=models.Count("id"))
    )
    popularity_dict = {p["job_id"]: p["count"] for p in popularity_map}

    # Build approximate user skill set
    user_interactions = JobInteraction.objects.filter(user_id=user_id)
    if user_interactions.exists():
        interacted_jobs = Job.objects.filter(
            id__in=[x.job.id for x in user_interactions]
        )
        user_skill_set = set()
        for j in interacted_jobs:
            for s in (j.skills or "").split(","):
                s_clean = s.strip().lower()
                if s_clean:
                    user_skill_set.add(s_clean)
    else:
        user_skill_set = set()

    recommendations = []
    for job in jobs:
        skills = [s.strip().lower() for s in (job.skills or "").split(",") if s.strip()]
        skill_match = len(user_skill_set.intersection(skills)) / max(len(skills), 1)

        cf_score = cf_scores.get(job.id, 0)
        popularity = popularity_dict.get(job.id, 0) / 100  # rough normalization

        final_score = (
            w_skill * skill_match +
            w_cf * cf_score +
            w_pop * popularity
        )

        recommendations.append({
            "job_id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "score": round(final_score, 4),
            "skill_match": round(skill_match, 2),
            "cf_score": round(cf_score, 2),
            "popularity": popularity,
        })

    recommendations = sorted(recommendations, key=lambda x: x["score"], reverse=True)
    return recommendations[:top_n]