from rest_framework import serializers
from .models import Job, Skill, JobSkill

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]

class JobSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True, read_only=True)
    class Meta:
        model = Job
        fields = ["id", "title", "company", "district", "lat", "lng", "description", "skills", "posted_at"]