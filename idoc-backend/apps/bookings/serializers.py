from rest_framework import serializers
from .models import Booking, Prescription
from apps.accounts.serializers import UserSerializer


class BookingSerializer(serializers.ModelSerializer):
    patient_detail = UserSerializer(source='patient', read_only=True)
    doctor_detail = UserSerializer(source='doctor', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ['id', 'patient', 'fee', 'status', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['doctor', 'date', 'time_slot', 'consultation_type', 'symptoms']

    def create(self, validated_data):
        request = self.context['request']
        doctor = validated_data['doctor']

        # Get fee from doctor profile
        fee = 0
        if hasattr(doctor, 'doctor_profile'):
            fee = doctor.doctor_profile.fee

        booking = Booking.objects.create(
            patient=request.user,
            fee=fee,
            **validated_data,
        )
        return booking


class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_detail = UserSerializer(source='doctor', read_only=True)
    patient_detail = UserSerializer(source='patient', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['id', 'doctor', 'patient', 'created_at']


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = ['booking', 'diagnosis', 'medicines', 'notes']

    def create(self, validated_data):
        request = self.context['request']
        booking = validated_data['booking']

        prescription = Prescription.objects.create(
            doctor=request.user,
            patient=booking.patient,
            **validated_data,
        )

        # Mark booking as completed
        booking.status = Booking.Status.COMPLETED
        booking.save()

        return prescription
