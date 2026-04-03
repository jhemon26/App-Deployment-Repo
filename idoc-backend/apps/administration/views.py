from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.utils import timezone
from apps.accounts.serializers import UserSerializer
from apps.accounts.permissions import IsAdmin
from apps.notifications.views import create_notification

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def admin_dashboard(request):
    """System-wide statistics for admin."""
    from apps.bookings.models import Booking
    from apps.orders.models import Order
    from apps.payments.models import Payment

    today = timezone.now().date()

    total_users = User.objects.count()
    users_by_role = dict(
        User.objects.values_list('role').annotate(count=Count('id')).values_list('role', 'count')
    )
    pending_approvals = User.objects.filter(is_approved=False, role__in=['doctor', 'pharmacy']).count()

    total_bookings = Booking.objects.count()
    today_bookings = Booking.objects.filter(date=today).count()

    total_orders = Order.objects.count()
    total_revenue = Payment.objects.filter(status='completed').aggregate(
        total=Sum('amount')
    )['total'] or 0

    # Build a lightweight activity feed for admin dashboard cards.
    activities = []

    recent_pending = User.objects.filter(
        is_approved=False,
        role__in=['doctor', 'pharmacy']
    ).order_by('-created_at')[:5]
    for item in recent_pending:
        activities.append({
            'id': f'approval-{item.id}',
            'type': 'approval',
            'text': f"{item.name} ({item.role}) is waiting for approval",
            'time': item.created_at.isoformat(),
            'created_at': item.created_at.isoformat(),
        })

    recent_bookings = Booking.objects.select_related('patient', 'doctor').order_by('-created_at')[:5]
    for booking in recent_bookings:
        activities.append({
            'id': f'booking-{booking.id}',
            'type': 'system',
            'text': f"Booking: {booking.patient.name} with Dr. {booking.doctor.name}",
            'time': booking.created_at.isoformat(),
            'created_at': booking.created_at.isoformat(),
        })

    recent_orders = Order.objects.select_related('customer', 'pharmacy').order_by('-created_at')[:5]
    for order in recent_orders:
        activities.append({
            'id': f'order-{order.id}',
            'type': 'payment',
            'text': f"Order {order.order_number} by {order.customer.name}",
            'time': order.created_at.isoformat(),
            'created_at': order.created_at.isoformat(),
        })

    recent_activity = sorted(
        activities,
        key=lambda x: x.get('created_at') or '',
        reverse=True,
    )[:10]

    return Response({
        'total_users': total_users,
        'users_by_role': users_by_role,
        'pending_approvals': pending_approvals,
        'total_bookings': total_bookings,
        'today_bookings': today_bookings,
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'blocked_users': User.objects.filter(is_blocked=True).count(),
        'recent_activity': recent_activity,
    })


class UserListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email']
    ordering_fields = ['created_at', 'name']

    def get_queryset(self):
        qs = User.objects.all()
        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)
        blocked = self.request.query_params.get('blocked')
        if blocked == 'true':
            qs = qs.filter(is_blocked=True)
        return qs


class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def block_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
        user.is_blocked = True
        user.save()
        create_notification(
            user, 'system',
            'Account Blocked',
            'Your account has been blocked by an administrator. Contact support for details.'
        )
        return Response({'status': 'blocked', 'user': UserSerializer(user).data})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def unblock_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
        user.is_blocked = False
        user.save()
        create_notification(
            user, 'system',
            'Account Unblocked',
            'Your account has been unblocked. You can now use the platform.'
        )
        return Response({'status': 'unblocked', 'user': UserSerializer(user).data})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def pending_approvals(request):
    """Get all users awaiting admin approval."""
    pending = User.objects.filter(
        is_approved=False, role__in=['doctor', 'pharmacy']
    ).order_by('-created_at').prefetch_related('doctor_profile', 'pharmacy_profile')

    payload = []
    for user in pending:
        item = {
            'id': str(user.id),
            'name': user.name,
            'email': user.email,
            'phone': user.phone,
            'type': user.role,
            'role': user.role,
            'submitted': user.created_at.isoformat(),
            'is_approved': user.is_approved,
        }

        if user.role == 'doctor' and hasattr(user, 'doctor_profile'):
            item.update({
                'specialty': user.doctor_profile.specialty,
                'experience': user.doctor_profile.experience,
                'license': user.doctor_profile.license_number,
                'license_number': user.doctor_profile.license_number,
            })

        if user.role == 'pharmacy' and hasattr(user, 'pharmacy_profile'):
            item.update({
                'pharmacy_name': user.pharmacy_profile.pharmacy_name,
                'address': user.pharmacy_profile.address,
                'license': user.pharmacy_profile.license_number,
                'license_number': user.pharmacy_profile.license_number,
            })

        payload.append(item)

    return Response(payload)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def approve_doctor(request, pk):
    try:
        user = User.objects.get(pk=pk, role='doctor')
        user.is_approved = True
        user.save()
        create_notification(
            user, 'approval',
            'Registration Approved!',
            'Your doctor account has been approved. You can now start offering consultations.'
        )
        return Response({'status': 'approved', 'user': UserSerializer(user).data})
    except User.DoesNotExist:
        return Response({'error': 'Doctor not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def approve_pharmacy(request, pk):
    try:
        user = User.objects.get(pk=pk, role='pharmacy')
        user.is_approved = True
        user.save()
        create_notification(
            user, 'approval',
            'Registration Approved!',
            'Your pharmacy account has been approved. You can now start listing medicines.'
        )
        return Response({'status': 'approved', 'user': UserSerializer(user).data})
    except User.DoesNotExist:
        return Response({'error': 'Pharmacy not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def reject_user(request, pk):
    try:
        user = User.objects.get(pk=pk)
        reason = request.data.get('reason', 'Your registration has been rejected.')
        create_notification(user, 'approval', 'Registration Rejected', reason)
        user.delete()
        return Response({'status': 'rejected'})
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)
