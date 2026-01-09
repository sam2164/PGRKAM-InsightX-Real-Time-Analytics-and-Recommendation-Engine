from django.urls import path
from .views_auth import me_view, register_view

urlpatterns = [
    path("auth/me/", me_view, name="me"),
    path("auth/register/", register_view, name="register"),
]