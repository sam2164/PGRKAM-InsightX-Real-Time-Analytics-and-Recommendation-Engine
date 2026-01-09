import csv
import random
from pathlib import Path

# ------------------------------------------------------------
# FORCE OUTPUT TO BACKEND ROOT (NOT core)
# ------------------------------------------------------------
CURRENT_FILE = Path(__file__).resolve()           # <backend/.../generate_jobs_csv.py>
BACKEND_DIR = CURRENT_FILE.parent                 # If file is inside core, this is /backend/core
PROJECT_ROOT = BACKEND_DIR.parent                # This is ALWAYS /backend

OUTPUT_PATH = PROJECT_ROOT / "insightx_punjab_jobs_1000.csv"

# ------------------------------------------------------------
# JOB GENERATION DATA
# ------------------------------------------------------------
titles = [
    "Data Entry Operator", "Computer Operator", "MIS Executive", "Career Counsellor",
    "Helpdesk Executive", "Lab Technician", "Field Coordinator", "District Coordinator",
    "Social Media Assistant", "IT Support Technician", "Office Assistant", "Admin Assistant",
    "Customer Support Executive", "Hardware Technician", "Apprentice - IT Support"
]

companies = [
    "Govt of Punjab - Revenue Dept", "Govt of Punjab - Health Dept",
    "Punjab Skill Development Mission", "Punjab Rural Development Dept",
    "PSEB", "Punjab Digital Office", "PGRKAM Partner Employer"
]

locations = [
    "Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Mohali", "Bathinda",
    "Hoshiarpur", "Firozpur", "Gurdaspur", "Pathankot"
]

skill_pool = [
    "Communication", "Excel", "Documentation", "Typing", "Field Work", "Tally",
    "English", "MS Office", "PowerPoint", "SQL", "Data Entry", "Teamwork",
    "Networking", "Hardware Support", "Customer Support", "Hindi", "Punjabi"
]

# ------------------------------------------------------------
# GENERATORS
# ------------------------------------------------------------
def generate_random_job():
    return {
        "title": random.choice(titles),
        "company": random.choice(companies),
        "location": random.choice(locations),
        "skills": ", ".join(random.sample(skill_pool, random.randint(4, 8)))
    }

def create_csv(n=1000):
    with open(OUTPUT_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["title", "company", "location", "skills"])

        for _ in range(n):
            job = generate_random_job()
            writer.writerow([job["title"], job["company"], job["location"], job["skills"]])

    print("\n✅ CSV generated successfully!")
    print(f"📍 Saved at: {OUTPUT_PATH}")

if __name__ == "__main__":
    create_csv()