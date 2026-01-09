# backend/insightx/recommender/success_score.py
from jobs.models import Job


def compute_success_score(job: Job, skill_overlap: float, engagement_score: float) -> float:
    """
    Simple predictive success score between 0 and 1.

    - skill_overlap: how many required skills the user has (0–1)
    - engagement_score: how engaged the user is with this job (0–1)
    - small bonus if the job is clearly in the Punjab govt ecosystem
    """
    # Weighted blend of skill + engagement
    base = 0.6 * float(skill_overlap) + 0.4 * float(engagement_score)

    # Small location / domain bonus for Punjab-government jobs
    text = f"{job.title} {job.company} {job.location}".lower()
    location_bonus = 0.05 if "punjab" in text else 0.0

    score = base + location_bonus
    score = max(0.0, min(score, 1.0))  # clamp to [0, 1]
    return round(score, 2)