# insightx/ml/ai_recommender/ga_optimizer.py
from django.db import models
from jobs.models import Job, JobInteraction
import random

def fitness(weights):
    # Fake fitness function: encourages balanced weights.
    w1, w2, w3 = weights
    return 1 - abs(w1 + w2 + w3 - 1)


def mutate(weights):
    return [max(0.05, min(0.9, w + random.uniform(-0.1, 0.1))) for w in weights]


def crossover(p1, p2):
    return [(p1[i] + p2[i]) / 2 for i in range(3)]


def optimize_weights(generations=20, population_size=10):
    population = [
        [random.random(), random.random(), random.random()]
        for _ in range(population_size)
    ]

    # Normalize
    population = [[w[0]/sum(w), w[1]/sum(w), w[2]/sum(w)] for w in population]

    for _ in range(generations):
        population = sorted(population, key=lambda w: fitness(w), reverse=True)
        new_pop = population[:4]  # elitism

        # Generate children
        while len(new_pop) < population_size:
            p1, p2 = random.sample(population[:6], 2)
            child = crossover(p1, p2)
            child = mutate(child)
            s = sum(child)
            new_pop.append([child[0]/s, child[1]/s, child[2]/s])

        population = new_pop

    best = population[0]
    return best