# insightx/admin.py

from django.contrib import admin
from .models import UserProfileAnalytics, AnalyticsEvent


@admin.register(UserProfileAnalytics)
class UserProfileAnalyticsAdmin(admin.ModelAdmin):
    list_display = ("user_id", "source_channel", "age", "gender", "education_level", "district", "created_at")
    search_fields = ("user_id", "source_channel", "district", "education_level", "gender")
    list_filter = ("source_channel", "gender", "education_level", "district")


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "user_id", "page", "job", "session_id", "created_at")
    list_filter = ("event_type", "page", "created_at")
    search_fields = ("user_id", "page", "session_id")
    raw_id_fields = ("job",)