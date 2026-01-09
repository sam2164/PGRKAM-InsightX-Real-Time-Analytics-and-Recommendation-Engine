from rest_framework import serializers
from jobs.models import Job, ApplicationEvent


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id",
            "title",
            "company",
            "location",
            "min_experience",
            "skills",
            "posted_at",
        ]


class ApplicationEventSerializer(serializers.ModelSerializer):
    # Nested job info (read-only) so APIs can show job details with the event
    job = JobSerializer(read_only=True)

    class Meta:
        model = ApplicationEvent
        fields = [
            "id",
            "user_id",
            "job",
            "event",
            "created_at",
        ]