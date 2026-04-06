from django.urls import path
from . import views

urlpatterns = [
    path('', views.AvailabilityListCreateView.as_view(), name='availability-list-create'),
    path('my-slots/', views.my_slots, name='availability-my-slots'),
    path('<uuid:pk>/', views.delete_slot, name='availability-delete'),
]
