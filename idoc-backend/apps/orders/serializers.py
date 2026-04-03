from rest_framework import serializers
from .models import Order, OrderItem
from apps.pharmacies.serializers import MedicineSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.CharField(source='medicine.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    pharmacy_name = serializers.CharField(source='pharmacy.name', read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['id', 'order_number', 'customer', 'total', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    pharmacy_id = serializers.UUIDField()
    delivery_address = serializers.CharField()
    notes = serializers.CharField(required=False, default='')
    items = serializers.ListField(child=serializers.DictField())
    # items: [{"medicine_id": "uuid", "quantity": 2}]

    def create(self, validated_data):
        from apps.pharmacies.models import Medicine
        request = self.context['request']
        items_data = validated_data.pop('items')

        subtotal = 0
        order_items = []
        for item in items_data:
            medicine = Medicine.objects.get(id=item['medicine_id'])
            item_total = medicine.price * item['quantity']
            subtotal += item_total
            order_items.append({
                'medicine': medicine,
                'quantity': item['quantity'],
                'price': medicine.price,
            })
            # Decrease stock
            medicine.stock -= item['quantity']
            medicine.save()

        order = Order.objects.create(
            customer=request.user,
            pharmacy_id=validated_data['pharmacy_id'],
            subtotal=subtotal,
            delivery_address=validated_data['delivery_address'],
            notes=validated_data.get('notes', ''),
        )

        for item in order_items:
            OrderItem.objects.create(order=order, **item)

        return order
