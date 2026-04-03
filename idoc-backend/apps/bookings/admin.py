from django.contrib import admin
from .models import Booking, Prescription

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'date', 'time_slot', 'status', 'fee']
    list_filter = ['status', 'consultation_type', 'date']
    search_fields = ['patient__name', 'doctor__name']

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ['doctor', 'patient', 'diagnosis', 'created_at']
    search_fields = ['doctor__name', 'patient__name']
