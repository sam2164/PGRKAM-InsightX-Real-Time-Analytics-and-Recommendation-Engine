# insightx/ml/skill_gap_model.py

from typing import List, Dict
from jobs.models import Job


def _normalize_skill_list(skills_raw: str) -> List[str]:
    """
    Turn a comma-separated skills string into a clean, lower-cased list.
    """
    if not skills_raw:
        return []
    parts = [p.strip().lower() for p in skills_raw.split(",")]
    return [p for p in parts if p]


def analyze_skill_gap(job_id: int, user_skills: List[str]) -> Dict:
    """
    Simple skill gap analysis:

    - Fetches the Job by id
    - Normalizes required skills from job.skills
    - Normalizes user_skills from the request
    - Returns which skills match, which are missing, and a match ratio
    """
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        # Graceful error instead of crashing
        return {
            "job_id": job_id,
            "error": f"Job with id {job_id} does not exist",
            "required_skills": [],
            "user_skills": user_skills,
            "matched_skills": [],
            "missing_skills": [],
            "match_ratio": 0.0,
        }

    # Normalize job skills
    required_skills = _normalize_skill_list(job.skills)

    # Normalize user skills
    user_skills_norm = [
        str(s).strip().lower()
        for s in (user_skills or [])
        if str(s).strip()
    ]

    # Compute missing vs matched
    required_set = set(required_skills)
    user_set = set(user_skills_norm)

    matched = sorted(required_set & user_set)
    missing = sorted(required_set - user_set)

    match_ratio = len(matched) / len(required_set) if required_set else 0.0

    return {
        "job_id": job.id,
        "job_title": job.title,
        "required_skills": required_skills,
        "user_skills": user_skills_norm,
        "matched_skills": matched,
        "missing_skills": missing,
        "match_ratio": round(match_ratio, 2),
    }