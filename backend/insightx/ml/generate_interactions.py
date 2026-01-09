import random
from datetime import timedelta
from django.utils import timezone
from django.contrib.auth.models import User
from jobs.models import Job, JobInteraction


def generate_synthetic_data(user_count=1000, interactions_per_user=80):
    print("⚡ Generating synthetic users + job interactions...")

    jobs = list(Job.objects.all())
    if not jobs:
        print("❌ No jobs found! Seed jobs first.")
        return

    # Create synthetic users
    users = []
    for i in range(user_count):
        user = User.objects.create(
            username=f"user{i}",
            email=f"user{i}@example.com"
        )
        users.append(user)

    print(f"✅ Created {len(users)} synthetic users.")

    # Create interactions
    event_weights = ["view", "save", "apply", "hire"]
    weights = [0.70, 0.20, 0.09, 0.01]

    total_interactions = 0

    for user in users:
        for _ in range(interactions_per_user):

            job = random.choice(jobs)
            event = random.choices(event_weights, weights=weights)[0]

            JobInteraction.objects.create(
                user_id=user.id,
                job=job,
                event=event,
                created_at=timezone.now() - timedelta(days=random.randint(0, 40))
            )

            total_interactions += 1

    print(f"✅ Synthetic interactions created: {total_interactions}")
    print("🎉 All done! Your recommendation engine can now train properly.")