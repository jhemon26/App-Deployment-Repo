import stripe
from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import serializers
from .models import Payment
from apps.accounts.permissions import IsActiveAndNotBlocked, IsApprovedBusinessUser

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'user', 'status', 'stripe_payment_intent_id', 'created_at']


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def create_payment_intent(request):
    """Create a Stripe PaymentIntent for booking or order."""
    amount = request.data.get('amount')
    payment_type = request.data.get('payment_type')  # 'booking' or 'order'
    booking_id = request.data.get('booking_id')
    order_id = request.data.get('order_id')

    if not amount or not payment_type:
        return Response({'error': 'Amount and payment_type are required'}, status=400)

    try:
        # Create Stripe PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(float(amount) * 100),  # Convert to cents/satang
            currency='thb',
            metadata={
                'user_id': str(request.user.id),
                'payment_type': payment_type,
            },
        )

        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            payment_type=payment_type,
            amount=amount,
            stripe_payment_intent_id=intent.id,
            booking_id=booking_id,
            order_id=order_id,
        )

        return Response({
            'client_secret': intent.client_secret,
            'payment_id': str(payment.id),
        })
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=400)
    except Exception as e:
        return Response({'error': 'Payment creation failed'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def confirm_payment(request):
    """Confirm payment was successful."""
    payment_id = request.data.get('payment_id')
    try:
        payment = Payment.objects.get(id=payment_id, user=request.user)
        intent = stripe.PaymentIntent.retrieve(payment.stripe_payment_intent_id)

        if intent.status == 'succeeded':
            payment.status = Payment.Status.COMPLETED
            payment.stripe_charge_id = intent.latest_charge or ''
            payment.save()

            # Update booking/order status
            if payment.booking:
                payment.booking.status = 'confirmed'
                payment.booking.save()
            if payment.order:
                payment.order.status = 'confirmed'
                payment.order.save()

            return Response({'status': 'completed', 'payment': PaymentSerializer(payment).data})
        else:
            payment.status = Payment.Status.FAILED
            payment.save()
            return Response({'status': 'failed'}, status=400)
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser])
def refund_payment(request, pk):
    """Refund a payment."""
    try:
        payment = Payment.objects.get(id=pk)
        if payment.status != Payment.Status.COMPLETED:
            return Response({'error': 'Can only refund completed payments'}, status=400)

        refund = stripe.Refund.create(payment_intent=payment.stripe_payment_intent_id)
        payment.status = Payment.Status.REFUNDED
        payment.save()
        return Response({'status': 'refunded', 'refund_id': refund.id})
    except Payment.DoesNotExist:
        return Response({'error': 'Payment not found'}, status=404)
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=400)


class PaymentHistoryView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsActiveAndNotBlocked, IsApprovedBusinessUser]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    """Handle Stripe webhook events."""
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        return Response(status=400)

    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
            payment.status = Payment.Status.COMPLETED
            payment.save()
        except Payment.DoesNotExist:
            pass

    return Response({'status': 'ok'})
