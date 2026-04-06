from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.accounts.permissions import IsActiveAndNotBlocked, IsDoctor, IsApprovedBusinessUser
from .models import DoctorAvailability
from .serializers import DoctorAvailabilitySerializer, DoctorAvailabilityCreateSerializer


class AvailabilityListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsActiveAndNotBlocked(), IsApprovedBusinessUser(), IsDoctor()]
        return [AllowAny()]

    def get_queryset(self):
        qs = DoctorAvailability.objects.filter(is_active=True, doctor__is_approved=True, doctor__is_blocked=False)
        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        specialty = self.request.query_params.get('specialty')
        if specialty:
            qs = qs.filter(doctor__doctor_profile__specialty__icontains=specialty)
        return qs.select_related('doctor', 'doctor__doctor_profile')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DoctorAvailabilityCreateSerializer
        return DoctorAvailabilitySerializer

    def get_serializer_context(self):
        return {'request': self.request}


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsDoctor])
def my_slots(request):
    qs = DoctorAvailability.objects.filter(doctor=request.user).order_by('-date', '-start_time')
    return Response(DoctorAvailabilitySerializer(qs, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsDoctor])
def delete_slot(request, pk):
    try:
        slot = DoctorAvailability.objects.get(pk=pk, doctor=request.user)
    except DoctorAvailability.DoesNotExist:
        return Response({'error': 'Availability slot not found'}, status=404)

    slot_start = datetime.combine(slot.date, slot.start_time)
    if timezone.is_naive(slot_start):
        slot_start = timezone.make_aware(slot_start, timezone.get_current_timezone())
    if slot_start - timezone.now() < timedelta(hours=12):
        return Response({'error': 'Cannot cancel availability within 12 hours of start time'}, status=400)

    slot.delete()
    return Response(status=204)
