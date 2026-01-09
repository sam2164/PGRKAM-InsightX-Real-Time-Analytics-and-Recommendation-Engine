from django.db import models
from django.conf import settings

class Skill(models.Model):
    name = models.CharField(max_length=128, unique=True)
    def __str__(self): return self.name

class Job(models.Model):
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200, blank=True)
    district = models.CharField(max_length=120, blank=True)  # for heatmap
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    description = models.TextField(blank=True)
    skills = models.ManyToManyField(Skill, through="JobSkill", related_name="jobs")
    posted_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return f"{self.title} @ {self.company}".strip()

class JobSkill(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    weight = models.FloatField(default=1.0)

class Interaction(models.Model):
    EVENT_CHOICES = [
        ("view", "view"),
        ("save", "save"),
        ("apply", "apply"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    event = models.CharField(max_length=10, choices=EVENT_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

class Application(models.Model):
    STATUS_CHOICES = [
        ("started", "started"),
        ("submitted", "submitted"),
        ("hired", "hired"),
        ("rejected", "rejected"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="started")
    predicted_success = models.FloatField(default=0.0)  # 0..1 model output
    created_at = models.DateTimeField(auto_now_add=True)