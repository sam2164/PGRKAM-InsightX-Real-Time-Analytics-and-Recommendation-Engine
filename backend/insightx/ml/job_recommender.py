# insightx/ml/job_recommender.py

from jobs.models import Job

def recommend_jobs_for_user(user_id: int, top_n: int = 10):
    """
    Very simple placeholder recommender so your API works.

    Returns the first N jobs in the database.
    Later you can replace this with your ML logic.
    """

    # Fetch all jobs from DB
    jobs = Job.objects.all()[:top_n]

    # Return a list of dicts with consistent structure
    results = []
    for job in jobs:
        results.append({
            "job": job,
            "score": None,
            "skill_overlap": None,
            "engagement_score": None,
        })

    return results