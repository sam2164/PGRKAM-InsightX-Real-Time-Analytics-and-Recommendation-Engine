from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Job, Skill


@api_view(["GET"])
def health_check(request):
    return Response({"status": "ok", "service": "PGRKAM InsightX backend"})


@api_view(["GET"])
def sample_recommendations(request):
    """
    Temporary dummy endpoint.
    Later we plug in collaborative filtering + genetic algorithm here.
    """
    jobs = list(
        Job.objects.all().values("id", "title", "company", "district")[:5]
    )

    return Response(
        {
            "user_id": 1,
            "recommendations": [
                {
                    "job_id": j["id"],
                    "title": j["title"],
                    "company": j["company"],
                    "district": j["district"],
                    "match_score": 0.8,  # placeholder
                }
                for j in jobs
            ],
        }
    )