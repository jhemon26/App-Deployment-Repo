from rest_framework import serializers
from .models import PatientRequest


class PatientRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = PatientRequest
        fields = '__all__'
        read_only_fields = ['id', 'patient', 'patient_name', 'status', 'created_at', 'updated_at']


class PatientRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientRequest
        fields = ['specialty', 'symptoms', 'urgency', 'preferred_date', 'preferred_time_range', 'notes']

    def create(self, validated_data):
        return PatientRequest.objects.create(patient=self.context['request'].user, **validated_data)
