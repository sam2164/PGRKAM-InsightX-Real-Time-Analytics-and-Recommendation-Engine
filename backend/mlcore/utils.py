import numpy as np

def recommend_cf(user_id: int, top_k=10):
    # stub: deterministic fake job IDs for demo
    rng = np.random.default_rng(seed=user_id)
    return [int(x) for x in rng.choice(100, size=top_k, replace=False)]

def genetic_rerank(job_ids):
    # stub: return same order (pretend GA reranking done)
    return job_ids

def predict_success(user_id: int, job_id: int) -> float:
    # stub: pseudo score based on ids
    return round(((user_id * 37 + job_id * 13) % 100) / 100, 2)