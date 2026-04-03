from django.urls import path
from . import views

urlpatterns = [
    path('', views.PharmacyListView.as_view(), name='pharmacy-list'),
    path('<int:pk>/', views.PharmacyDetailView.as_view(), name='pharmacy-detail'),
    path('medicines/', views.MedicineListView.as_view(), name='medicine-list'),
    path('medicines/create/', views.MedicineCreateView.as_view(), name='medicine-create'),
    path('medicines/<uuid:pk>/', views.MedicineUpdateView.as_view(), name='medicine-update'),
    path('dashboard/', views.pharmacy_dashboard, name='pharmacy-dashboard'),
]
