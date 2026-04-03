from rest_framework import generics, status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.accounts.models import PharmacyProfile
from apps.accounts.serializers import PharmacyProfileSerializer
from apps.accounts.permissions import IsPharmacy, IsActiveAndNotBlocked, IsApprovedBusinessUser
from .models import Medicine
from .serializers import MedicineSerializer


class PharmacyListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PharmacyProfileSerializer

    def get_queryset(self):
        return PharmacyProfile.objects.filter(
            user__is_approved=True, user__is_blocked=False
        ).select_related('user')


class PharmacyDetailView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = PharmacyProfileSerializer
    queryset = PharmacyProfile.objects.filter(user__is_approved=True).select_related('user')


class MedicineListView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = MedicineSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'category']
    ordering_fields = ['price', 'name']

    def get_queryset(self):
        qs = Medicine.objects.filter(is_active=True)
        pharmacy_id = self.request.query_params.get('pharmacy')
        category = self.request.query_params.get('category')
        if pharmacy_id:
            qs = qs.filter(pharmacy_id=pharmacy_id)
        if category:
            qs = qs.filter(category__icontains=category)
        return qs.select_related('pharmacy')


class MedicineCreateView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsPharmacy]
    serializer_class = MedicineSerializer

    def perform_create(self, serializer):
        serializer.save(pharmacy=self.request.user)


class MedicineUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsPharmacy]
    serializer_class = MedicineSerializer

    def get_queryset(self):
        return Medicine.objects.filter(pharmacy=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser, IsPharmacy])
def pharmacy_dashboard(request):
    from apps.orders.models import Order
    from django.utils import timezone

    today = timezone.now().date()
    medicines = Medicine.objects.filter(pharmacy=request.user)
    orders = Order.objects.filter(pharmacy=request.user)

    return Response({
        'total_medicines': medicines.count(),
        'low_stock': medicines.filter(stock__lt=20).count(),
        'total_orders': orders.count(),
        'today_orders': orders.filter(created_at__date=today).count(),
        'new_orders': orders.filter(status='pending').count(),
        'today_revenue': float(
            sum(o.total for o in orders.filter(created_at__date=today, status='delivered'))
        ),
    })
