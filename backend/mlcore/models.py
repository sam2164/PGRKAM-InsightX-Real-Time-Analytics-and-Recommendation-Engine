from django.db import models


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self) -> str:
        return self.name


class Job(models.Model):
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    district = models.CharField(max_length=100)

    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)

    description = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"{self.title} @ {self.company}"


class JobSkill(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="job_skills")
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name="skill_jobs")
    weight = models.FloatField(default=1.0)

    class Meta:
        unique_together = ("job", "skill")

    def __str__(self) -> str:
        return f"{self.job} ↔ {self.skill} ({self.weight})"


class Interaction(models.Model):
    """
    Basic interaction log for collaborative filtering:
    - user_id: fake numeric ID for now
    - clicked / applied: implicit & explicit feedback
    """

    user_id = models.IntegerField()
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="interactions")
    clicked = models.BooleanField(default=False)
    applied = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"User {self.user_id} → {self.job} (clicked={self.clicked}, applied={self.applied})"