# insightx/ml/ai_recommender/similarity_engine.py
from django.db import models
from jobs.models import Job, JobInteraction
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from jobs.models import JobInteraction


def build_user_job_matrix():
    interactions = JobInteraction.objects.all()

    user_ids = list(interactions.values_list("user_id", flat=True).distinct())
    job_ids = list(interactions.values_list("job_id", flat=True).distinct())

    user_index = {u: i for i, u in enumerate(user_ids)}
    job_index = {j: i for i, j in enumerate(job_ids)}

    matrix = np.zeros((len(user_ids), len(job_ids)))

    for x in interactions:
        u = user_index[x.user_id]
        j = job_index[x.job.id]

        # Rating weights based on event
        weight = {"view": 1, "save": 3, "apply": 5, "hire": 7}[x.event]
        matrix[u][j] = weight

    return matrix, user_ids, job_ids


def compute_cf_scores(user_id, matrix, user_ids, job_ids):
    if user_id not in user_ids:
        return {}

    target_index = user_ids.index(user_id)

    # Compute cosine similarity between users
    user_sim = cosine_similarity(matrix)

    # Similarity vector for this user
    sim_vector = user_sim[target_index]

    cf_scores = {}

    for j, job_id in enumerate(job_ids):
        # Weighted average score for job j
        weighted_score = np.dot(sim_vector, matrix[:, j])
        cf_scores[job_id] = float(weighted_score)

    return cf_scores