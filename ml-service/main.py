# Minimal offline demo for collaborative-filtering style top-N based on user-skill overlap.
import pandas as pd

def recommend(user_skill_counts, job_skills, top_n=5):
    # user_skill_counts: dict skill->weight
    # job_skills: list of (job_id, [skills])
    scored = []
    for job_id, skills in job_skills:
        score = sum(user_skill_counts.get(s.lower(), 0) for s in skills)
        scored.append((job_id, score))
    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_n]

if __name__ == "__main__":
    user_skill_counts = {"python": 3, "excel": 2, "sql": 1}
    jobs = [
        ("Data Analyst", ["excel", "sql", "powerbi"]),
        ("Python Dev", ["python", "django"]),
        ("BI Intern", ["powerbi", "excel"]),
    ]
    print("Top-N:", recommend(user_skill_counts, jobs, top_n=3))
