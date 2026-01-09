import random
from django.core.management.base import BaseCommand
from jobs.models import Job, ApplicationEvent


TITLES = [
    "Junior Clerk",
    "Data Entry Operator",
    "Field Mobilizer",
    "Assistant Employment Officer",
    "IT Assistant",
    "MIS Executive",
    "Block Coordinator",
    "Helpdesk Executive",
    "Apprentice - IT Support",
    "Junior Assistant (Accounts)",
    "Computer Operator",
    "Community Facilitator",
    "Career Counsellor",
    "District Coordinator",
    "Social Media Assistant",
    "Lab Technician",
    "Library Assistant",
]

DEPARTMENTS = [
    "Govt of Punjab - Department of Revenue",
    "Govt of Punjab - PGRKAM Project",
    "Govt of Punjab - Skill Development Mission",
    "Govt of Punjab - Education Department",
    "Govt of Punjab - Rural Development",
    "Govt of Punjab - Health Department",
    "Govt of Punjab - Finance Department",
    "Govt of Punjab - eGovernance Cell",
    "District Bureau of Employment & Enterprise",
]

DISTRICTS = [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Mohali",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sangrur",
    "SBS Nagar",
    "Tarn Taran",
]

SKILL_TAGS = [
    "Typing",
    "MS Office",
    "Excel",
    "PowerPoint",
    "Word",
    "Data Entry",
    "Data Analysis",
    "SQL",
    "Tally",
    "Accounting",
    "Communication",
    "Counselling",
    "Customer Support",
    "Phone Handling",
    "Email Support",
    "Field Work",
    "Reporting",
    "Documentation",
    "Computer Basics",
    "Hardware Support",
    "Networking",
    "English",
    "Hindi",
    "Punjabi",
    "Teamwork",
    "Time Management",
    "Problem Solving",
]


class Command(BaseCommand):
    help = "Seed database with many Punjab-style government jobs and user interactions"

    def add_arguments(self, parser):
        parser.add_argument(
            "--n",
            type=int,
            default=500,
            help="Number of jobs to create (default: 500)",
        )

    def handle(self, *args, **options):
        n_jobs = options["n"]

        self.stdout.write("Clearing old jobs and events...")
        ApplicationEvent.objects.all().delete()
        Job.objects.all().delete()

        # ---------- create jobs ----------
        jobs_to_create = []
        for _ in range(n_jobs):
            title = random.choice(TITLES)
            dept = random.choice(DEPARTMENTS)
            district = random.choice(DISTRICTS)
            min_exp = random.randint(0, 5)

            skills = ",".join(
                sorted(
                    set(
                        random.sample(
                            SKILL_TAGS,
                            k=random.randint(4, 8),
                        )
                    )
                )
            )

            jobs_to_create.append(
                Job(
                    title=title,
                    company=dept,
                    location=district,
                    min_experience=min_exp,
                    skills=skills,
                )
            )

        created_jobs = Job.objects.bulk_create(jobs_to_create)
        self.stdout.write(self.style.SUCCESS(f"Created {len(created_jobs)} jobs"))

        # ---------- create interaction events ----------
        events_to_create = []
        for job in created_jobs:
            # random 1–10 interactions per job
            for _ in range(random.randint(1, 10)):
                user_id = random.randint(1, 50)  # fake users 1..50
                event = random.choice(["view", "save", "apply"])
                events_to_create.append(
                    ApplicationEvent(
                        user_id=user_id,
                        job=job,
                        event=event,
                    )
                )

        ApplicationEvent.objects.bulk_create(events_to_create)
        self.stdout.write(
            self.style.SUCCESS(
                f"Created {len(events_to_create)} application events. Seeding complete."
            )
        )