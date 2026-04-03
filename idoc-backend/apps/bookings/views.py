from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import Booking, Prescription
from .serializers import (
    BookingSerializer, BookingCreateSerializer,
    PrescriptionSerializer, PrescriptionCreateSerializer,
)
from apps.accounts.permissions import IsDoctor, IsActiveAndNotBlocked, IsApprovedBusinessUser


class BookingCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = BookingCreateSerializer

    def get_serializer_context(self):
        return {'request': self.request}


class BookingListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            qs = Booking.objects.filter(doctor=user)
        elif user.role == 'admin':
            qs = Booking.objects.all()
        else:
            qs = Booking.objects.filter(patient=user)

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.select_related('patient', 'doctor')


class BookingDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Booking.objects.all()
        return Booking.objects.filter(Q(patient=user) | Q(doctor=user))


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def cancel_booking(request, pk):
    try:
        booking = Booking.objects.get(pk=pk)
        if booking.patient != request.user and booking.doctor != request.user:
            return Response({'error': 'Not authorized'}, status=403)
        if booking.status in ['completed', 'cancelled']:
            return Response({'error': 'Cannot cancel this booking'}, status=400)
        booking.status = Booking.Status.CANCELLED
        booking.save()
        return Response(BookingSerializer(booking).data)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def confirm_booking(request, pk):
    try:
        booking = Booking.objects.get(pk=pk, doctor=request.user)
        booking.status = Booking.Status.CONFIRMED
        booking.save()
        return Response(BookingSerializer(booking).data)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)


class PrescriptionCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsDoctor]
    serializer_class = PrescriptionCreateSerializer

    def get_serializer_context(self):
        return {'request': self.request}


class PrescriptionListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Prescription.objects.filter(doctor=user).select_related('doctor', 'patient', 'booking')
        return Prescription.objects.filter(patient=user).select_related('doctor', 'patient', 'booking')
