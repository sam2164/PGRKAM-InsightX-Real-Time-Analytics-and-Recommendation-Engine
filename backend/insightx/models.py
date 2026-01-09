
from django.db import models
from jobs.models import Job
from django.utils import timezone




class UserProfileAnalytics(models.Model):
    user_id = models.IntegerField()
    source_channel = models.CharField(max_length=100, blank=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=50, blank=True)
    education_level = models.CharField(max_length=100, blank=True)
    district = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile {self.user_id} ({self.source_channel})"


class AnalyticsEvent(models.Model):
    user_id = models.IntegerField()
    event_type = models.CharField(max_length=50)
    page = models.CharField(max_length=200, blank=True)
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL)
    session_id = models.CharField(max_length=100, blank=True)
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_id} - {self.event_type} - {self.page}"


class JobOutcome(models.Model):
    """
    Stores success/failure of job applications per user.
    This is what we use for 'collective analysis of success/failure rate'
    and to adjust future recommendations.
    """
    STATUS_CHOICES = (
        ("success", "Success"),
        ("failure", "Failure"),
    )

    user_id = models.IntegerField()
    job = models.ForeignKey(Job, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    missing_skills = models.JSONField(default=list, blank=True)
    match_ratio = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        job_id = self.job_id if self.job_id else "no-job"
        return f"{self.user_id} - {job_id} - {self.status}"
    # insightx/models.py

class UserProfileAnalytics(models.Model):
    # NOT unique – we want multiple rows per user over time
    user_id = models.IntegerField()

    source_channel = models.CharField(max_length=100, blank=True, default="")
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(max_length=50, blank=True, default="")
    education_level = models.CharField(max_length=100, blank=True, default="")
    district = models.CharField(max_length=100, blank=True, default="")

    # for history ordering
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"UserProfileAnalytics(user={self.user_id}, channel={self.source_channel})"


class AnalyticsEvent(models.Model):
    user_id = models.IntegerField()
    event_type = models.CharField(max_length=100)
    page = models.CharField(max_length=200, blank=True, default="")
    job = models.ForeignKey(Job, null=True, blank=True, on_delete=models.SET_NULL)
    session_id = models.CharField(max_length=200, blank=True, default="")
    meta = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.event_type} (user={self.user_id})"