from django.contrib import admin
from .models import Job, Skill, JobSkill, Interaction, Application
admin.site.register(Job)
admin.site.register(Skill)
admin.site.register(JobSkill)
admin.site.register(Interaction)
admin.site.register(Application)