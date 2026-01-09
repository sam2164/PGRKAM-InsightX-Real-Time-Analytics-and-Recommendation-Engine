# insightx/recommender/cf_engine.py

"""
Simple hybrid recommender:
- Uses skill overlap (from Job.skills vs user_skills)
- Uses implicit feedback (ApplicationEvent counts)
This is *not* heavy ML, but good enough for a capstone demo and
works with the current views that pass user_skills.
"""

from collections import defaultdict

from jobs.models import Job, ApplicationEvent


def _normalize_scores(scores_dict):
    """
    Normalize a dict of {job_id: raw_score} into 0–1 range.
    """
    if not scores_dict:
        return {}

    values = list(scores_dict.values())
    min_v = min(values)
    max_v = max(values)
    if max_v == min_v:
        # all equal → return 0.5 for everything
        return {jid: 0.5 for jid in scores_dict}

    return {jid: (v - min_v) / (max_v - min_v) for jid, v in scores_dict.items()}


def recommend_jobs_cf(
    user_id=None,
    user_skills=None,
    jobs_qs=None,
    events_qs=None,
    top_n=20,
    **kwargs,
):
    """
    Main collaborative/content-based recommender.

    Parameters
    ----------
    user_id : int | None
        Current user id (used only for logging / future extension).
    user_skills : list[str] | set[str] | None
        Skills for this user (e.g. from resume or profile).
    jobs_qs : QuerySet[Job] | None
        Jobs to consider. If None, uses Job.objects.all().
    events_qs : QuerySet[ApplicationEvent] | None
        Interaction events (view/save/apply). If None, uses all events.
    top_n : int
        Number of jobs to return.

    Returns
    -------
    list[dict]
        Each item: {"job": Job, "score": float,
                    "skill_overlap": float, "engagement_score": float}
    """

    # --------- defaults & preprocessing ----------
    if jobs_qs is None:
        jobs_qs = Job.objects.all()

    if events_qs is None:
        events_qs = ApplicationEvent.objects.all()

    # Normalize user_skills to a lowercase set
    if user_skills is None:
        user_skills_set = set()
    else:
        user_skills_set = {
            s.strip().lower() for s in user_skills if isinstance(s, str) and s.strip()
        }

    # ---------- 1) skill overlap score ----------
    skill_scores = {}
    for job in jobs_qs:
        job_skill_tokens = {
            s.strip().lower()
            for s in (job.skills or "").split(",")
            if s.strip()
        }

        if not job_skill_tokens or not user_skills_set:
            overlap = 0.0
        else:
            common = job_skill_tokens & user_skills_set
            overlap = len(common) / float(len(job_skill_tokens))

        skill_scores[job.id] = overlap

    norm_skill_scores = _normalize_scores(skill_scores)

    # ---------- 2) implicit feedback score (views/saves/applies) ----------
    # weight different events differently
    event_weights = {
        "view": 1.0,
        "save": 2.0,
        "apply": 3.0,
    }

    engagement_raw = defaultdict(float)
    for ev in events_qs:
        w = event_weights.get(ev.event, 1.0)
        engagement_raw[ev.job_id] += w

    norm_engagement_scores = _normalize_scores(engagement_raw)

    # ---------- 3) combine scores ----------
    ALPHA = 0.7  # weight for skills
    BETA = 0.3   # weight for engagement

    combined = []
    for job in jobs_qs:
        s_score = norm_skill_scores.get(job.id, 0.0)
        e_score = norm_engagement_scores.get(job.id, 0.0)
        final_score = ALPHA * s_score + BETA * e_score

        combined.append(
            {
                "job": job,
                "score": float(round(final_score, 4)),
                "skill_overlap": float(round(s_score, 4)),
                "engagement_score": float(round(e_score, 4)),
            }
        )

    # sort & truncate
    combined.sort(key=lambda x: x["score"], reverse=True)
    return combined[:top_n]