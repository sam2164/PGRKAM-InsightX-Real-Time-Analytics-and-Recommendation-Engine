from rest_framework import viewsets, decorators, response
from .models import Job, ApplicationEvent
from .serializers import JobSerializer, ApplicationEventSerializer

class JobViewSet(viewsets.ReadOnlyModelViewSet):
    # Order by `posted_at` (this field exists) instead of `created_at`
    queryset = Job.objects.order_by("-posted_at")
    serializer_class = JobSerializer

class ApplicationEventViewSet(viewsets.ModelViewSet):
    queryset = ApplicationEvent.objects.select_related("job").order_by("-created_at")
    serializer_class = ApplicationEventSerializer

@decorators.api_view(["GET"])
def health(_request):
    return response.Response({"ok": True})

@decorators.api_view(["GET"])
def recommendations(_request):
    qs = Job.objects.order_by("-posted_at")[:10]
    return response.Response(JobSerializer(qs, many=True).data)

@decorators.api_view(["POST"])
def log_event(request):
    ser = ApplicationEventSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ser.save()
    return response.Response(ser.data, status=201)
from django.http import JsonResponse
from jobs.models import Job, JobInteraction
from .ml.ai_recommender.hybrid_recommender import recommend_jobs_hybrid

def dashboard_stats(request):
    user_id = int(request.GET.get("user_id", 1))

    matched_jobs = Job.objects.count()
    skill_gaps = 4  # static for now
    applications = JobInteraction.objects.filter(
        user_id=user_id, event="apply"
    ).count()

    return JsonResponse({
        "matched_jobs": matched_jobs,
        "skill_gaps": skill_gaps,
        "applications": applications,
    })
