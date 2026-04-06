import uuid
from django.conf import settings
from django.db import models


class PatientRequest(models.Model):
    class Urgency(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'
        RESOLVED = 'resolved', 'Resolved'
        CANCELLED = 'cancelled', 'Cancelled'

    class TimeRange(models.TextChoices):
        MORNING = 'morning', 'Morning'
        AFTERNOON = 'afternoon', 'Afternoon'
        EVENING = 'evening', 'Evening'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patient_requests')
    specialty = models.CharField(max_length=120)
    symptoms = models.TextField()
    urgency = models.CharField(max_length=20, choices=Urgency.choices, default=Urgency.MEDIUM)
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time_range = models.CharField(max_length=20, choices=TimeRange.choices, default=TimeRange.MORNING)
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient.name} - {self.specialty} ({self.urgency})"
