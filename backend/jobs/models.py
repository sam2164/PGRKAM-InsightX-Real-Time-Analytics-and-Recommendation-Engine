# backend/jobs/models.py
from django.db import models
from django.db import models

class Job(models.Model):
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255)

    # NEW FIELDS
    description = models.TextField(blank=True, null=True)
    qualifications = models.TextField(blank=True, null=True)

    # already exists
    skills = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.title} - {self.company}"


class JobInteraction(models.Model):
    user_id = models.IntegerField()
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    event = models.CharField(
        max_length=50,
        choices=[
            ("view", "view"),
            ("save", "save"),
            ("apply", "apply"),
            ("hire", "hire"),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"User {self.user_id} -> {self.job.title} ({self.event})"