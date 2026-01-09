# core/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin Panel
    path("admin/", admin.site.urls),

    # Delegate ALL insightX API routes to insightx/urls.py
    path("api/insightx/", include("insightx.urls")),
]