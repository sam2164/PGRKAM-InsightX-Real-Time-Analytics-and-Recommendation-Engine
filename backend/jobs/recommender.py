# Very small placeholder recommender.
# Later you can replace with collaborative filtering + genetic re-ranking.

from collections import Counter

def simple_recommend(user_events, jobs, top_n=5):
    """
    user_events: list of dicts with keys {job_id, event, skills(list[str])}
    jobs: list of dicts with keys {id, title, skills(list[str])}
    """
    skill_counts = Counter()
    for e in user_events:
        for s in e.get("skills", []):
            skill_counts[s.lower()] += 1

    def score(job):
        js = [s.lower().strip() for s in job.get("skills", [])]
        return sum(skill_counts.get(s, 0) for s in js)

    ranked = sorted(jobs, key=score, reverse=True)
    return ranked[:top_n]
