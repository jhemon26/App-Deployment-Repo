from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.admin_dashboard, name='admin-dashboard'),
    path('users/', views.UserListView.as_view(), name='admin-users'),
    path('users/<uuid:pk>/', views.UserDetailView.as_view(), name='admin-user-detail'),
    path('users/<uuid:pk>/block/', views.block_user, name='admin-block-user'),
    path('users/<uuid:pk>/unblock/', views.unblock_user, name='admin-unblock-user'),
    path('pending-approvals/', views.pending_approvals, name='admin-pending-approvals'),
    path('doctors/<uuid:pk>/approve/', views.approve_doctor, name='admin-approve-doctor'),
    path('pharmacies/<uuid:pk>/approve/', views.approve_pharmacy, name='admin-approve-pharmacy'),
    path('users/<uuid:pk>/reject/', views.reject_user, name='admin-reject-user'),
]
