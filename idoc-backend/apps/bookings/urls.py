from django.urls import path
from . import views

urlpatterns = [
    path('', views.BookingListView.as_view(), name='booking-list'),
    path('create/', views.BookingCreateView.as_view(), name='booking-create'),
    path('<uuid:pk>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('<uuid:pk>/cancel/', views.cancel_booking, name='booking-cancel'),
    path('<uuid:pk>/confirm/', views.confirm_booking, name='booking-confirm'),
    path('prescriptions/', views.PrescriptionListView.as_view(), name='prescription-list'),
    path('prescriptions/create/', views.PrescriptionCreateView.as_view(), name='prescription-create'),
]
