import uuid
from django.conf import settings
from django.db import models


class DoctorAvailability(models.Model):
    class ConsultationType(models.TextChoices):
        VIDEO = 'video', 'Video'
        CHAT = 'chat', 'Chat'
        BOTH = 'both', 'Both'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='availability_slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    consultation_type = models.CharField(max_length=10, choices=ConsultationType.choices, default=ConsultationType.VIDEO)
    max_bookings = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"Dr {self.doctor.name}: {self.date} {self.start_time}-{self.end_time}"
