from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from apps.accounts.models import User, DoctorProfile
from apps.accounts.serializers import DoctorProfileSerializer
from apps.accounts.permissions import IsDoctor, IsActiveAndNotBlocked, IsApprovedBusinessUser


class DoctorListView(generics.ListAPIView):
    """List all approved doctors with search/filter."""
    permission_classes = [AllowAny]
    serializer_class = DoctorProfileSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__name', 'specialty']
    ordering_fields = ['fee', 'rating', 'user__name']

    def get_queryset(self):
        qs = DoctorProfile.objects.filter(user__is_approved=True, user__is_blocked=False)
        specialty = self.request.query_params.get('specialty')
        available = self.request.query_params.get('available')
        if specialty:
            qs = qs.filter(specialty__icontains=specialty)
        if available == 'true':
            qs = qs.filter(is_available=True)
        return qs.select_related('user')


class DoctorDetailView(generics.RetrieveAPIView):
    """Get single doctor profile."""
    permission_classes = [AllowAny]
    serializer_class = DoctorProfileSerializer
    queryset = DoctorProfile.objects.filter(user__is_approved=True).select_related('user')


@api_view(['GET'])
@permission_classes([AllowAny])
def doctor_slots(request, pk):
    """Get available time slots for a doctor on a specific date."""
    date = request.query_params.get('date')
    try:
        doctor = DoctorProfile.objects.get(pk=pk)
    except DoctorProfile.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)

    # TODO: Check actual bookings and generate available slots from schedule
    # For now, return default slots
    slots = [
        {'time': '09:00', 'available': True},
        {'time': '09:30', 'available': True},
        {'time': '10:00', 'available': True},
        {'time': '10:30', 'available': False},
        {'time': '11:00', 'available': True},
        {'time': '13:00', 'available': True},
        {'time': '13:30', 'available': True},
        {'time': '14:00', 'available': True},
        {'time': '15:00', 'available': True},
        {'time': '15:30', 'available': False},
        {'time': '16:00', 'available': True},
        {'time': '17:00', 'available': True},
    ]
    return Response({'date': date, 'slots': slots})


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsDoctor])
def doctor_dashboard(request):
    """Dashboard stats for the logged-in doctor."""
    profile = request.user.doctor_profile
    from apps.bookings.models import Booking
    from django.utils import timezone

    today = timezone.now().date()
    today_bookings = Booking.objects.filter(
        doctor=request.user, date=today
    ).count()
    total_patients = Booking.objects.filter(
        doctor=request.user
    ).values('patient').distinct().count()
    total_earnings = Booking.objects.filter(
        doctor=request.user, status='completed'
    ).count() * float(profile.fee)

    return Response({
        'today_appointments': today_bookings,
        'total_patients': total_patients,
        'total_earnings': total_earnings,
        'rating': float(profile.rating),
        'total_consultations': profile.total_consultations,
    })
