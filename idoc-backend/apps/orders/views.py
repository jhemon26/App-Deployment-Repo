from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Order
from .serializers import OrderSerializer, OrderCreateSerializer
from apps.accounts.permissions import IsPharmacy, IsActiveAndNotBlocked, IsApprovedBusinessUser


class OrderCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = OrderCreateSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'pharmacy':
            qs = Order.objects.filter(pharmacy=user)
        elif user.role == 'admin':
            qs = Order.objects.all()
        else:
            qs = Order.objects.filter(customer=user)

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.select_related('customer', 'pharmacy').prefetch_related('items__medicine')


class OrderDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = OrderSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all()
        return Order.objects.filter(customer=user) | Order.objects.filter(pharmacy=user)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def cancel_order(request, pk):
    try:
        order = Order.objects.get(pk=pk, customer=request.user)
        if order.status not in ['pending', 'confirmed']:
            return Response({'error': 'Cannot cancel this order'}, status=400)
        order.status = Order.Status.CANCELLED
        order.save()
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsPharmacy])
def update_order_status(request, pk):
    try:
        order = Order.objects.get(pk=pk, pharmacy=request.user)
        new_status = request.data.get('status')
        valid_transitions = {
            'pending': ['confirmed', 'cancelled'],
            'confirmed': ['preparing', 'cancelled'],
            'preparing': ['ready'],
            'ready': ['on_the_way'],
            'on_the_way': ['delivered'],
        }
        if new_status not in valid_transitions.get(order.status, []):
            return Response({'error': f'Cannot transition from {order.status} to {new_status}'}, status=400)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
