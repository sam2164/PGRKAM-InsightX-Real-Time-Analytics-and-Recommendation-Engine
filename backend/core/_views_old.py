from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count
from .models import Job, Skill, Interaction
from .serializers import JobSerializer
from mlcore.utils import recommend_cf, genetic_rerank, predict_success

@api_view(["GET"])
def recommendations(request, user_id: int):
    ids = recommend_cf(user_id, top_k=12)
    jobs = list(Job.objects.filter(id__in=ids))
    # keep incoming order
    jobs_sorted = sorted(jobs, key=lambda j: ids.index(j.id))
    jobs_sorted = genetic_rerank(jobs_sorted)
    return Response(JobSerializer(jobs_sorted, many=True).data)

@api_view(["POST"])
def score(request):
    try:
        user_id = int(request.data.get("user_id"))
        job_id = int(request.data.get("job_id"))
    except Exception:
        return Response({"detail": "user_id and job_id required"}, status=400)
    s = predict_success(user_id, job_id)  # 0..1
    return Response({"user_id": user_id, "job_id": job_id, "score": s})

@api_view(["POST"])
def events(request):
    """
    Capture client events: {user_id, job_id, event: view|save|apply}
    """
    user_id = request.data.get("user_id")
    job_id = request.data.get("job_id")
    event = request.data.get("event")
    if not all([user_id, job_id, event]):
        return Response({"detail": "user_id, job_id, event required"}, status=400)
    Interaction.objects.create(user_id=user_id, job_id=job_id, event=event)
    return Response({"ok": True})

@api_view(["GET"])
def skill_gap(request, user_id: int):
    """
    GET /api/skills/gap/<user_id>?job_id=123
    Response: { missing_skills: [..], suggestions: [..] }
    """
    job_id = request.GET.get("job_id")
    if not job_id:
        return Response({"detail": "job_id required"}, status=400)
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"detail": "job not found"}, status=404)

    job_skill_names = set(job.skills.values_list("name", flat=True))
    # stub user skills (swap with real profile later)
    user_skill_names = set(["Python", "Excel", "Communication"])
    missing = sorted(job_skill_names - user_skill_names)

    suggestions = []
    for sk in missing:
        suggestions.append({
            "skill": sk,
            "cert": f"{sk} Fundamentals",
            "provider": "Coursera",
            "est_hours": 10
        })
    return Response({"missing_skills": missing, "suggestions": suggestions})

@api_view(["GET"])
def geo_heatmap(request):
    """
    GET /api/geo/heatmap?metric=applications&period=30d
    Simplified demo data grouped by district.
    """
    qs = Job.objects.values("district", "lat", "lng").annotate(count=Count("id")).order_by("-count")[:25]
    data = []
    for row in qs:
        if not row["district"]:
            continue
        data.append({
            "district": row["district"],
            "lat": row["lat"] or 31.1,
            "lng": row["lng"] or 75.3,
            "value": row["count"],
        })
    return Response({"points": data})