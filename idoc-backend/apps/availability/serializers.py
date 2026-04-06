from rest_framework import serializers
from .models import DoctorAvailability


class AvailabilityDoctorSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='doctor_profile.id', read_only=True)
    name = serializers.CharField(read_only=True)
    specialty = serializers.CharField(source='doctor_profile.specialty', read_only=True)
    rating = serializers.DecimalField(source='doctor_profile.rating', max_digits=3, decimal_places=2, read_only=True)
    fee = serializers.DecimalField(source='doctor_profile.fee', max_digits=10, decimal_places=2, read_only=True)


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)
    doctor_id = serializers.IntegerField(source='doctor.doctor_profile.id', read_only=True)
    doctor = AvailabilityDoctorSerializer(read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = '__all__'
        read_only_fields = ['id', 'doctor', 'doctor_name', 'doctor_id', 'created_at', 'updated_at']


class DoctorAvailabilityCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorAvailability
        fields = ['date', 'start_time', 'end_time', 'consultation_type', 'max_bookings', 'notes']

    def create(self, validated_data):
        return DoctorAvailability.objects.create(doctor=self.context['request'].user, **validated_data)
