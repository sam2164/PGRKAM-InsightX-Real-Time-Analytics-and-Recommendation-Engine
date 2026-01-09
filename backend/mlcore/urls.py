from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path("sample-recommendations/", views.sample_recommendations, name="sample_recommendations"),
]