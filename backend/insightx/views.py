import json
from datetime import timedelta
from collections import defaultdict

from django.db.models import Count
from django.http import JsonResponse
from django.utils import timezone
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import UserProfileAnalytics, AnalyticsEvent
from jobs.models import Job
from .ml.ai_recommender.hybrid_recommender import recommend_jobs_hybrid
from django.http import JsonResponse


def chatbot_view(request):
    return JsonResponse({"message": "Chatbot endpoint not implemented"})


# ---------------------------------------------------------
# HELPER
# ---------------------------------------------------------
def _safe_int(value, default=0):
    try:
        return int(value)
    except Exception:
        return default


# ---------------------------------------------------------
# JOB DETAIL
# ---------------------------------------------------------
@api_view(["GET"])
def job_detail(request, job_id):
    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)

    return Response(
        {
            "id": job.id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "description": job.description or "",
            "qualifications": job.qualifications or "",
            "skills": [
                s.strip()
                for s in (job.skills or "").split(",")
                if s.strip()
            ],
        }
    )


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------
def health_check(request):
    return JsonResponse({"status": "ok"})


# ---------------------------------------------------------
# JOB LIST VIEW
# ---------------------------------------------------------
class JobListView(View):
    def get(self, request):
        qs = Job.objects.all().order_by("id")

        jobs = [
            {
                "id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "description": getattr(job, "description", "") or "",
                "qualifications": getattr(job, "qualifications", "") or "",
                "skills": getattr(job, "skills", "") or "",
            }
            for job in qs
        ]

        return JsonResponse({"jobs": jobs})


# ---------------------------------------------------------
# SKILL MATCH (used by "Apply" button if needed)
# ---------------------------------------------------------
@api_view(["POST"])
def skill_match(request):
    job_id = request.data.get("job_id")
    user_skills = request.data.get("user_skills", [])

    if not job_id:
        return Response({"error": "job_id required"}, status=400)

    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)

    job_skills = [
        s.strip().lower()
        for s in (job.skills or "").split(",")
        if s.strip()
    ]
    user_skills = [
        s.strip().lower()
        for s in user_skills
        if s.strip()
    ]

    matched = sorted(set(job_skills) & set(user_skills))
    missing = sorted(set(job_skills) - set(user_skills))

    match_ratio = round((len(matched) / len(job_skills)) * 100, 2) if job_skills else 0

    return Response(
        {
            "matched": matched,
            "missing": missing,
            "match_ratio": match_ratio,
        }
    )


# ---------------------------------------------------------
# SKILL GAP (used on dashboard / jobs)
# ---------------------------------------------------------
@api_view(["POST"])
def skill_gap(request):
    job_id = request.data.get("job_id")
    user_skills = request.data.get("user_skills", [])

    if not job_id:
        return Response({"error": "job_id required"}, status=400)

    try:
        job = Job.objects.get(id=job_id)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)

    job_skills = [
        s.strip().lower()
        for s in (job.skills or "").split(",")
        if s.strip()
    ]
    user_skills = [
        s.strip().lower()
        for s in user_skills
        if s.strip()
    ]

    matched = sorted(set(job_skills) & set(user_skills))
    missing = sorted(set(job_skills) - set(user_skills))
    match_ratio = round((len(matched) / len(job_skills)) * 100, 2) if job_skills else 0

    return Response(
        {
            "job_id": job.id,
            "job_title": job.title,
            "required_skills": job_skills,
            "user_skills": user_skills,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_ratio": match_ratio,
        }
    )


# ---------------------------------------------------------
# AI JOB RECOMMENDER  ✅ FIXED
# ---------------------------------------------------------
@api_view(["GET", "POST"])
def recommend_jobs(request):
    """
    AI job recommendation engine:
    - Accepts user typed skills from frontend (GET ?skills=... or POST {skills: ...}).
    - Computes match score based on overlap with Job.skills (comma-separated).
    """

    # 1) Accept skills from GET or POST
    if request.method == "GET":
        raw_skills = request.GET.get("skills", "")
    else:  # POST
        raw_skills = request.data.get("skills") or ""

    # Convert to clean skill list
    if isinstance(raw_skills, list):
        user_skills = [s.lower().strip() for s in raw_skills if str(s).strip()]
    else:
        user_skills = [
            s.lower().strip()
            for s in str(raw_skills).split(",")
            if s.strip()
        ]

    if not user_skills:
        return Response(
            {
                "results": [],
                "error": "No skills provided",
            },
            status=200,
        )

    # 2) Fetch all available jobs
    jobs = Job.objects.all()
    results = []

    for job in jobs:
        # Use job.skills (comma-separated) instead of non-existent job.required_skills
        required = [
            s.lower().strip()
            for s in str(getattr(job, "skills", "") or "").split(",")
            if s.strip()
        ]

        matched = set(user_skills) & set(required)
        missing = set(required) - set(user_skills)

        if required:
            score = len(matched) / len(required)
        else:
            score = 0.0

        results.append(
            {
                "job_id": job.id,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "required_skills": required,
                "recommended_skills": list(missing),
                "score": float(score),
            }
        )

    # 3) Sort jobs by highest score
    results.sort(key=lambda x: x["score"], reverse=True)

    # 4) Return top N
    try:
        top_n = int(request.GET.get("top_n", 5))
    except ValueError:
        top_n = 5

    return Response({"results": results[:top_n]})


# ---------------------------------------------------------
# USER STATS (HOME SCREEN)
# ---------------------------------------------------------
@require_GET
def user_stats_overview(request):
    user_id = request.GET.get("user_id")
    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)

    uid = _safe_int(user_id)
    events = AnalyticsEvent.objects.filter(user_id=uid)

    return JsonResponse(
        {
            "user_id": uid,
            "total_jobs": Job.objects.count(),
            "applications": events.filter(event_type="job_apply").count(),
            "matched_jobs": events.filter(event_type="job_view").count(),
            # Simple placeholder
            "skill_gaps": 2,
        }
    )


# ---------------------------------------------------------
# ANALYTICS OVERVIEW (BIG DASHBOARD)
# ---------------------------------------------------------
@require_GET
def analytics_overview(request):
    user_id = request.GET.get("user_id")
    if not user_id:
        return JsonResponse({"error": "user_id required"}, status=400)

    uid = _safe_int(user_id)
    now = timezone.now()
    start = now - timedelta(days=29)

    # Success / failure
    success = AnalyticsEvent.objects.filter(
        user_id=uid, event_type="job_apply_success"
    ).count()
    fail = AnalyticsEvent.objects.filter(
        user_id=uid, event_type="job_apply_failure"
    ).count()
    total = success + fail
    success_rate = round((success / total) * 100, 2) if total else 0
    failure_rate = 100 - success_rate

    # Applications per day (last 30 days)
    per_day = (
        AnalyticsEvent.objects.filter(
            user_id=uid,
            event_type__in=[
                "job_apply",
                "job_apply_success",
                "job_apply_failure",
            ],
            created_at__date__gte=start.date(),
        )
        .extra({"day": "date(created_at)"})
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    applications_per_day = [
        {
            "date": r["day"].strftime("%Y-%m-%d")
            if hasattr(r["day"], "strftime")
            else str(r["day"]),
            "count": r["count"],
        }
        for r in per_day
    ]

    # Top companies (by applies)
    top_companies_qs = (
        AnalyticsEvent.objects.filter(
            user_id=uid,
            event_type__in=[
                "job_apply",
                "job_apply_success",
                "job_apply_failure",
            ],
            job__isnull=False,
        )
        .values("job__company")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    top_companies = [
        {"company": r["job__company"] or "Unknown", "count": r["count"]}
        for r in top_companies_qs
    ]

    # Top locations
    top_locations_qs = (
        AnalyticsEvent.objects.filter(
            user_id=uid,
            event_type__in=[
                "job_apply",
                "job_apply_success",
                "job_apply_failure",
            ],
            job__isnull=False,
        )
        .values("job__location")
        .annotate(count=Count("id"))
        .order_by("-count")[:5]
    )

    top_locations = [
        {"location": r["job__location"] or "Unknown", "count": r["count"]}
        for r in top_locations_qs
    ]

    # Page views
    page_views_qs = (
        AnalyticsEvent.objects.filter(
            user_id=uid,
            event_type="page_view",
        )
        .values("page")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    page_views = [
        {"page": r["page"] or "(unknown)", "count": r["count"]}
        for r in page_views_qs
    ]

    # Acquisition channels
    channels_qs = (
        UserProfileAnalytics.objects.all()
        .values("source_channel")
        .annotate(count=Count("id"))
        .order_by("-count")
    )
    channels = [
        {"channel": r["source_channel"] or "Unknown", "count": r["count"]}
        for r in channels_qs
    ]

    return JsonResponse(
        {
            "success_rate": success_rate,
            "failure_rate": failure_rate,
            "applications_per_day": applications_per_day,
            "top_companies": top_companies,
            "top_locations": top_locations,
            "page_views": page_views,
            "channels": channels,
        }
    )


# ---------------------------------------------------------
# USER PROFILE ANALYTICS (used by Profile page)
# ---------------------------------------------------------
@api_view(["GET", "POST"])
def user_profile_analytics(request):
    if request.method == "GET":
        user_id = request.GET.get("user_id")
        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        uid = _safe_int(user_id)
        try:
            obj = UserProfileAnalytics.objects.get(user_id=uid)
        except UserProfileAnalytics.DoesNotExist:
            return Response({"user_id": uid})

        return Response(
            {
                "user_id": uid,
                "source_channel": obj.source_channel,
                "age": obj.age,
                "gender": obj.gender,
                "education_level": obj.education_level,
                "district": obj.district,
                "created_at": getattr(obj, "created_at", None),
            }
        )

    # POST: upsert
    data = request.data or {}
    uid = _safe_int(data.get("user_id"))

    UserProfileAnalytics.objects.update_or_create(
        user_id=uid,
        defaults={
            "source_channel": data.get("source_channel"),
            "age": data.get("age"),
            "gender": data.get("gender"),
            "education_level": data.get("education_level"),
            "district": data.get("district"),
        },
    )

    return Response({"status": "saved"})


# ---------------------------------------------------------
# TRACK EVENT
# ---------------------------------------------------------
@api_view(["POST"])
def track_event(request):
    """
    Generic tracking endpoint used by frontend (page_view, scroll_depth, etc.)

    Expected JSON:
    {
      "user_id": 1,
      "event_type": "page_view",
      "page": "/analytics",
      "session_id": "uuid",
      "job_id": 10 (optional),
      "meta": {...} (optional)
    }
    """
    data = request.data or {}

    uid = _safe_int(data.get("user_id"))
    event_type = data.get("event_type") or ""
    page = data.get("page") or ""
    session_id = data.get("session_id") or ""
    meta = data.get("meta") or {}

    job_obj = None
    if data.get("job_id"):
        try:
            job_obj = Job.objects.get(id=_safe_int(data.get("job_id")))
        except Job.DoesNotExist:
            job_obj = None

    AnalyticsEvent.objects.create(
        user_id=uid,
        event_type=event_type,
        page=page,
        session_id=session_id,
        job=job_obj,
        meta=meta,
    )

    return Response({"status": "ok"})


# ---------------------------------------------------------
# MARK APPLICATION OUTCOME (success / failure)
# ---------------------------------------------------------
@api_view(["POST"])
def mark_application_outcome(request):
    """
    Simple endpoint to mark a job application as success or failure.

    JSON:
    {
      "user_id": 1,
      "job_id": 10,
      "outcome": "success" | "failure",
      "failure_reason": "skills mismatch" (optional)
    }
    """
    data = request.data or {}

    user_id = data.get("user_id")
    job_id = data.get("job_id")
    outcome = (data.get("outcome") or "").strip().lower()
    failure_reason = (data.get("failure_reason") or "").strip()

    if not user_id or not job_id or outcome not in ["success", "failure"]:
        return Response(
            {
                "error": "user_id, job_id and outcome ('success' or 'failure') required"
            },
            status=400,
        )

    uid = _safe_int(user_id)
    jid = _safe_int(job_id)

    try:
        job = Job.objects.get(id=jid)
    except Job.DoesNotExist:
        return Response({"error": "Job not found"}, status=404)

    event_type = "job_apply_success" if outcome == "success" else "job_apply_failure"
    meta = {}
    if outcome == "failure" and failure_reason:
        meta["failure_reason"] = failure_reason

    AnalyticsEvent.objects.create(
        user_id=uid,
        event_type=event_type,
        page="/jobs",
        job=job,
        session_id=data.get("session_id", ""),
        meta=meta,
    )

    return Response({"status": "recorded", "event_type": event_type})


# ---------------------------------------------------------
# APPLICATION OUTCOME EXPORT
# ---------------------------------------------------------
@require_GET
def application_outcomes_export(request):
    rows = list(
        AnalyticsEvent.objects.filter(
            event_type__in=["job_apply", "job_apply_success", "job_apply_failure"]
        ).values()
    )
    return JsonResponse({"rows": rows})


# ---------------------------------------------------------
# ACQUISITION EXPORT
# ---------------------------------------------------------
@require_GET
def acquisition_export(request):
    rows = list(UserProfileAnalytics.objects.all().values())
    return JsonResponse({"rows": rows})


# ---------------------------------------------------------
# DEMOGRAPHICS HISTORY (for Analytics page chart)
# ---------------------------------------------------------
@require_GET
def demographics_history(request):
    """
    Returns raw rows of UserProfileAnalytics.
    Frontend will aggregate by age / gender / district.
    """
    rows = list(
        UserProfileAnalytics.objects.all()
        .order_by("id")
        .values("id", "user_id", "age", "gender", "education_level", "district")
    )
    return JsonResponse({"rows": rows})


# ---------------------------------------------------------
# COLLECTIVE OUTCOME PATTERNS (Requirement 5)
# ---------------------------------------------------------
def _analyze_outcomes_for_user(user_id: int):
    """
    Collective analysis of success / failure patterns for a user,
    with respect to job requirements (skills, companies, locations).

    Uses AnalyticsEvent with event_type in ["job_apply_success", "job_apply_failure"].
    """
    outcomes_qs = (
        AnalyticsEvent.objects.filter(
            user_id=user_id,
            event_type__in=["job_apply_success", "job_apply_failure"],
            job__isnull=False,
        )
        .select_related("job")
        .order_by("-created_at")
    )

    total_apps = outcomes_qs.count()
    if total_apps == 0:
        return {
            "total_applications": 0,
            "success_count": 0,
            "failure_count": 0,
            "success_rate": 0.0,
            "failure_rate": 0.0,
            "skill_outcomes": [],
            "skills_helping_success": [],
            "skills_linked_to_failure": [],
            "recommended_skill_focus": [],
            "job_patterns": {
                "by_company": [],
                "by_location": [],
            },
            "message": "No applications recorded yet for this user.",
        }

    # Overall success / failure
    success_count = outcomes_qs.filter(event_type="job_apply_success").count()
    failure_count = outcomes_qs.filter(event_type="job_apply_failure").count()

    success_rate = round(success_count * 100.0 / total_apps, 2)
    failure_rate = round(failure_count * 100.0 / total_apps, 2)

    # Skill-level + company/location patterns
    skill_stats = defaultdict(lambda: {"success": 0, "failure": 0})
    company_counts = defaultdict(lambda: {"success": 0, "failure": 0})
    location_counts = defaultdict(lambda: {"success": 0, "failure": 0})

    for ev in outcomes_qs:
        job = ev.job
        if not job:
            continue

        skills = [
            s.strip()
            for s in (job.skills or "").split(",")
            if s.strip()
        ]

        is_success = ev.event_type == "job_apply_success"
        is_failure = ev.event_type == "job_apply_failure"

        for raw_skill in skills:
            if not raw_skill:
                continue
            skill = raw_skill.strip()
            if is_success:
                skill_stats[skill]["success"] += 1
            elif is_failure:
                skill_stats[skill]["failure"] += 1

        company = (job.company or "Unknown company").strip()
        location = (job.location or "Unknown location").strip()

        if is_success:
            company_counts[company]["success"] += 1
            location_counts[location]["success"] += 1
        elif is_failure:
            company_counts[company]["failure"] += 1
            location_counts[location]["failure"] += 1

    # Convert skills to list with success_rate
    skill_outcomes = []
    for skill, counts in skill_stats.items():
        s = counts["success"]
        f = counts["failure"]
        total = s + f
        rate = round(s * 100.0 / total, 2) if total > 0 else 0.0
        skill_outcomes.append(
            {
                "skill": skill,
                "success_count": s,
                "failure_count": f,
                "total_applications": total,
                "success_rate": rate,
            }
        )

    # Identify helpful and risky skills
    skills_helping_success = []
    skills_linked_to_failure = []

    for entry in skill_outcomes:
        total = entry["total_applications"]
        s = entry["success_count"]
        f = entry["failure_count"]
        rate = entry["success_rate"]

        if total < 2:
            continue

        if rate >= 60.0 and s >= 2:
            skills_helping_success.append(entry["skill"])

        if f >= 2 and rate <= 40.0:
            skills_linked_to_failure.append(entry["skill"])

    # Recommended skill focus (skills with many failures and low success)
    recommended_skill_focus = []
    for entry in sorted(
        skill_outcomes, key=lambda e: e["failure_count"], reverse=True
    ):
        if entry["failure_count"] >= 2 and entry["success_rate"] < 60.0:
            recommended_skill_focus.append(
                {
                    "skill": entry["skill"],
                    "reason": (
                        f"This skill appears in {entry['total_applications']} of your "
                        f"applications but has only a {entry['success_rate']}% success rate. "
                        "Consider strengthening it for better outcomes."
                    ),
                    "failure_count": entry["failure_count"],
                    "success_rate": entry["success_rate"],
                }
            )

    recommended_skill_focus = recommended_skill_focus[:10]

    def _to_pattern_list(counter_dict, key_field_name):
        result = []
        for key, cf in counter_dict.items():
            s = cf["success"]
            f = cf["failure"]
            total = s + f
            rate = round(s * 100.0 / total, 2) if total > 0 else 0.0
            result.append(
                {
                    key_field_name: key,
                    "success_count": s,
                    "failure_count": f,
                    "total_applications": total,
                    "success_rate": rate,
                }
            )
        result.sort(
            key=lambda e: (e["success_rate"], e["total_applications"]), reverse=True
        )
        return result

    company_patterns = _to_pattern_list(company_counts, "company")
    location_patterns = _to_pattern_list(location_counts, "location")

    return {
        "total_applications": total_apps,
        "success_count": success_count,
        "failure_count": failure_count,
        "success_rate": success_rate,
        "failure_rate": failure_rate,
        "skill_outcomes": skill_outcomes,
        "skills_helping_success": skills_helping_success[:10],
        "skills_linked_to_failure": skills_linked_to_failure[:10],
        "recommended_skill_focus": recommended_skill_focus,
        "job_patterns": {
            "by_company": company_patterns[:10],
            "by_location": location_patterns[:10],
        },
    }


@require_GET
def outcome_patterns_view(request):
    """
    GET /api/insightx/analytics/outcome-patterns/?user_id=1

    Returns aggregated success / failure patterns for that user profile,
    with respect to job requirements (skills, company, location).
    """
    user_id_param = request.GET.get("user_id")
    try:
        user_id = int(user_id_param) if user_id_param is not None else None
    except (TypeError, ValueError):
        user_id = None

    if user_id is None:
        return JsonResponse(
            {"error": "Missing or invalid user_id parameter."},
            status=400,
        )

    data = _analyze_outcomes_for_user(user_id)
    return JsonResponse(data, safe=False)


from django.views.decorators.http import require_GET


@require_GET
def powerbi_data(request):
    """
    Unified analytics endpoint for Power BI.
    """
    user_id_param = request.GET.get("user_id", 1)
    uid = _safe_int(user_id_param, 1)

    # Get overview analytics
    overview_response = analytics_overview(request)
    if overview_response.status_code == 200:
        overview_data = json.loads(overview_response.content.decode())
    else:
        overview_data = {}

    # Success/Failure patterns
    outcome_data = _analyze_outcomes_for_user(uid)

    # Raw tables
    acquisition_rows = list(UserProfileAnalytics.objects.all().values())
    event_rows = list(AnalyticsEvent.objects.all().values())
    job_rows = list(Job.objects.all().values())

    return JsonResponse(
        {
            "user_id": uid,
            "overview": overview_data,
            "outcome_patterns": outcome_data,
            "acquisition": acquisition_rows,
            "events": event_rows,
            "jobs": job_rows,
        },
        safe=False,
    )