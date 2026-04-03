from django.urls import path
from . import views

urlpatterns = [
    path('create-intent/', views.create_payment_intent, name='payment-create-intent'),
    path('confirm/', views.confirm_payment, name='payment-confirm'),
    path('history/', views.PaymentHistoryView.as_view(), name='payment-history'),
    path('<uuid:pk>/refund/', views.refund_payment, name='payment-refund'),
    path('webhook/', views.stripe_webhook, name='stripe-webhook'),
]
