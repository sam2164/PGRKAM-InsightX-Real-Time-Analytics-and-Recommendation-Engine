# insightx/recommender/ga_optimizer.py
"""
Simple Genetic Algorithm (GA) optimizer.
Takes job scoring results from CF engine and re-ranks them slightly.
This keeps your capstone realistic but lightweight.
"""

import random


def optimize_recommendations(
    scored_jobs=None,
    population_size=30,
    generations=20,
    mutation_rate=0.1,
    **kwargs,
):
    """
    Parameters
    ----------
    scored_jobs : list[dict]
        Items from CF engine -> [{"job": Job, "score": float, ...}, ...]

    Returns
    -------
    list[dict]
        Re-ranked jobs (slightly shuffled using GA).
    """

    if not scored_jobs:
        return []

    # ---------------------------------------------
    # STEP 1 — Prepare population
    # ---------------------------------------------
    base = scored_jobs[:]  # copy list
    population = []

    for _ in range(population_size):
        individual = base[:]
        random.shuffle(individual)
        population.append(individual)

    # ---------------------------------------------
    # STEP 2 — Fitness function
    # ---------------------------------------------
    def fitness(individual):
        # Weighted sum score: earlier jobs contribute more
        score = 0.0
        weight = len(individual)
        for item in individual:
            score += item["score"] * weight
            weight -= 1
        return score

    # ---------------------------------------------
    # STEP 3 — Genetic Algorithm Loop
    # ---------------------------------------------
    for _ in range(generations):
        # Sort by fitness
        population.sort(key=fitness, reverse=True)

        # Keep top 20%
        survivors = population[: max(2, population_size // 5)]

        # Crossover
        new_population = survivors[:]
        while len(new_population) < population_size:
            p1, p2 = random.sample(survivors, 2)
            cut = random.randint(1, len(scored_jobs) - 2)

            child = p1[:cut] + [x for x in p2 if x not in p1[:cut]]

            # Mutation
            if random.random() < mutation_rate:
                i, j = random.sample(range(len(child)), 2)
                child[i], child[j] = child[j], child[i]

            new_population.append(child)

        population = new_population

    # Final best individual
    population.sort(key=fitness, reverse=True)
    best = population[0]

    # return top 20
    return best[:20]