from django.urls import path
from . import views

urlpatterns = [
    path('', views.PatientRequestListCreateView.as_view(), name='request-list-create'),
    path('<uuid:pk>/', views.PatientRequestDetailView.as_view(), name='request-detail'),
    path('<uuid:pk>/cancel/', views.cancel_request, name='request-cancel'),
]
