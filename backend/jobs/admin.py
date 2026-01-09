from django.contrib import admin
from .models import Job

class JobAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "company", "location")
    search_fields = ("title", "company", "location")
    list_filter = ("company",)

    fields = (
        "title",
        "company",
        "location",
        "description",
        "qualifications",
        "skills",
    )

admin.site.register(Job, JobAdmin)