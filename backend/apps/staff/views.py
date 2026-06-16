from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import StaffMember, ShiftSession
from .serializers import (
    StaffSerializer, StaffCreateSerializer,
    ShiftSessionSerializer, StaffTokenObtainSerializer,
)


class StaffTokenObtainView(TokenObtainPairView):
    """Standard JWT login (username + password)."""
    serializer_class = StaffTokenObtainSerializer


class StaffViewSet(viewsets.ModelViewSet):
    queryset = StaffMember.objects.filter(is_active=True)
    serializer_class = StaffSerializer

    def get_serializer_class(self):
        if self.action == 'create':
            return StaffCreateSerializer
        return StaffSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        if self.action == 'pin_login':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @action(detail=False, methods=['post'], authentication_classes=[], permission_classes=[permissions.AllowAny],
            url_path='pin-login')
    def pin_login(self, request):
        """Login using just a PIN — returns JWT tokens."""
        pin = request.data.get('pin', '')
        try:
            staff = StaffMember.objects.get(pin=pin, is_active=True)
        except StaffMember.DoesNotExist:
            return Response({'detail': 'Invalid PIN.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(staff)
        refresh['name']     = staff.name
        refresh['role']     = staff.role
        refresh['staff_id'] = staff.id

        # Start shift session
        ShiftSession.objects.create(staff=staff)

        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'staff':   StaffSerializer(staff).data,
        })

    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        return Response(StaffSerializer(request.user).data)

    @action(detail=True, methods=['post'], url_path='end-shift')
    def end_shift(self, request, pk=None):
        session = ShiftSession.objects.filter(
            staff=self.get_object(), ended_at__isnull=True
        ).last()
        if session:
            session.ended_at = timezone.now()
            session.save()
        return Response({'detail': 'Shift ended.'})


class ShiftSessionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ShiftSession.objects.select_related('staff').all()
    serializer_class = ShiftSessionSerializer
    filterset_fields  = ['staff']
    ordering_fields   = ['-started_at']
