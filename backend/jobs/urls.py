# backend/insightx/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check),

    path("recommend/jobs/", views.recommend_jobs_api),
    path("skill-gap/", views.skill_gap),
    path("chatbot/", views.chatbot_view),

    path("dashboard/stats/", views.user_stats_overview),
    path("analytics/overview/", views.analytics_overview),

    path("user/profile-analytics/", views.user_profile_analytics),

    path("capture-source-channel/", views.capture_source_channel),
    path("track-event/", views.track_event),
]