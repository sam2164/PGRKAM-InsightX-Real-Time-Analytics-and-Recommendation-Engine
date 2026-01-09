# insightx/urls.py
from django.urls import path

from .views import (
    # Health
    health_check,

    # Jobs + skills
    JobListView,
    job_detail,
    skill_match,
    skill_gap,

    # Recommender
    recommend_jobs,

    # Dashboard / stats
    user_stats_overview,
    analytics_overview,
    outcome_patterns_view,

    # Profile analytics
    user_profile_analytics,

    # Event tracking
    track_event,

    # Application outcomes
    mark_application_outcome,

    # Export endpoints
    application_outcomes_export,
    acquisition_export,

    # Demographics + external data
    demographics_history,
    powerbi_data,
)

urlpatterns = [
    # Health
    path("health/", health_check, name="health-check"),

    # Jobs + skills
    path("jobs/list/", JobListView.as_view(), name="jobs-list"),
    path("jobs/detail/<int:job_id>/", job_detail, name="job-detail"),
    path("skill-match/", skill_match, name="skill-match"),
    path("skill-gap/", skill_gap, name="skill-gap"),

    # Recommender (used by Home.jsx)
    path("recommend/jobs/", recommend_jobs, name="recommend-jobs"),

    # Dashboard / stats (used by Home.jsx)
    path("user/stats/", user_stats_overview, name="user-stats"),
    path("analytics/overview/", analytics_overview, name="analytics-overview"),
    path(
        "analytics/outcome-patterns/",
        outcome_patterns_view,
        name="outcome-patterns",
    ),

    # Profile analytics (used by Profile page)
    path(
        "profile/analytics/",
        user_profile_analytics,
        name="profile-analytics",
    ),
    path(
        "user/profile-analytics/",
        user_profile_analytics,
        name="user-profile-analytics",
    ),

    # Event tracking (page + job events)
    path("track-event/", track_event, name="track-event"),

    # Application outcome (Accept / Reject buttons)
    path(
        "applications/outcome/",
        mark_application_outcome,
        name="applications-outcome",
    ),
    path(
        "mark-application-outcome/",
        mark_application_outcome,
        name="mark-application-outcome",
    ),

    # Export endpoints
    path(
        "export/outcomes/",
        application_outcomes_export,
        name="export-outcomes",
    ),
    path(
        "export/acquisition/",
        acquisition_export,
        name="export-acquisition",
    ),

    # Demographics history (used in Analytics.jsx)
    path(
        "analytics/demographics-history/",
        demographics_history,
        name="demographics-history",
    ),

    # Optional Power BI / external dashboard
    path("powerbi/data/", powerbi_data, name="powerbi-data"),
]