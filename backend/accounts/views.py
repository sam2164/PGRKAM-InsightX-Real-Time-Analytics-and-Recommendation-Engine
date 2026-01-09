from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import RegisterSerializer, MeSerializer

@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response({"ok": True, "username": user.username}, status=status.HTTP_201_CREATED)

@api_view(["GET"])
def me(request):
    return Response(MeSerializer(request.user).data)