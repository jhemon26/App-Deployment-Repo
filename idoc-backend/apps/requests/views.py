from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import IsActiveAndNotBlocked
from .models import PatientRequest
from .serializers import PatientRequestSerializer, PatientRequestCreateSerializer


class PatientRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked]

    def get_queryset(self):
        user = self.request.user
        qs = PatientRequest.objects.all()

        # General users can only see their own requests, doctors/admin can see feed
        if user.role == 'general':
            qs = qs.filter(patient=user)

        urgency = self.request.query_params.get('urgency')
        status_filter = self.request.query_params.get('status')
        if urgency:
            qs = qs.filter(urgency=urgency)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.select_related('patient')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PatientRequestCreateSerializer
        return PatientRequestSerializer

    def get_serializer_context(self):
        return {'request': self.request}


class PatientRequestDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked]
    serializer_class = PatientRequestSerializer

    def get_queryset(self):
        user = self.request.user
        qs = PatientRequest.objects.all()
        if user.role == 'general':
            qs = qs.filter(patient=user)
        return qs.select_related('patient')


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked])
def cancel_request(request, pk):
    try:
        item = PatientRequest.objects.get(pk=pk)
    except PatientRequest.DoesNotExist:
        return Response({'error': 'Request not found'}, status=404)

    if item.patient != request.user and request.user.role != 'admin':
        return Response({'error': 'Not authorized'}, status=403)

    if item.status in [PatientRequest.Status.CANCELLED, PatientRequest.Status.RESOLVED, PatientRequest.Status.CLOSED]:
        return Response({'error': 'Request cannot be cancelled'}, status=400)

    item.status = PatientRequest.Status.CANCELLED
    item.save(update_fields=['status', 'updated_at'])
    return Response(PatientRequestSerializer(item).data)
