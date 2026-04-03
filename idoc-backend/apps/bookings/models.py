import uuid
from django.db import models
from django.conf import settings


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'

    class ConsultationType(models.TextChoices):
        VIDEO = 'video', 'Video Call'
        CHAT = 'chat', 'Chat'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_bookings')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_bookings')
    date = models.DateField()
    time_slot = models.TimeField()
    consultation_type = models.CharField(max_length=10, choices=ConsultationType.choices, default=ConsultationType.VIDEO)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    symptoms = models.TextField(blank=True)
    fee = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-time_slot']
        unique_together = ['doctor', 'date', 'time_slot']

    def __str__(self):
        return f"{self.patient.name} → {self.doctor.name} on {self.date} {self.time_slot}"


class Prescription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='prescription')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions_written')
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions_received')
    diagnosis = models.TextField()
    medicines = models.JSONField(default=list)
    # Format: [{"name": "...", "dosage": "...", "duration": "...", "instructions": "..."}]
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Rx: {self.doctor.name} → {self.patient.name} ({self.created_at.date()})"
