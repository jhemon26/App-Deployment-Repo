import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Button, Divider, Badge } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { orderAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function CartScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const { cart = {}, medicines = [], pharmacy } = route?.params || {};

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const med = medicines.find((m) => String(m.id) === String(id));
      return med ? { ...med, qty, total: med.price * qty } : null;
    })
    .filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const deliveryFee = 50;
  const total = subtotal + deliveryFee;

  const handleOrder = () => {
    if (!pharmacy?.ownerId) {
      Toast.show({ type: 'error', text1: 'Order failed', text2: 'Pharmacy information is missing.' });
      return;
    }

    const itemsPayload = cartItems.map((item) => ({
      medicine_id: item.id,
      quantity: item.qty,
    }));

    setLoading(true);

    orderAPI.create({
      pharmacy_id: pharmacy.ownerId,
      delivery_address: pharmacy.address || 'Primary address',
      notes: '',
      items: itemsPayload,
    }).then(() => {
      Toast.show({ type: 'success', text1: 'Order Placed!', text2: 'Your medicines are on the way' });
      navigation.popToTop();
    }).catch((error) => {
      Toast.show({ type: 'error', text1: 'Order failed', text2: error.response?.data?.error || 'Please try again' });
    }).finally(() => {
      setLoading(false);
    });
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={36} color={COLORS.pharmacy} />
        </View>
        <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: SPACING.lg }}>Cart is Empty</Text>
        <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xxxl }}>
          Add medicines from the pharmacy to place an order
        </Text>
        <Button
          title="Browse Medicines"
          onPress={() => navigation.goBack()}
          variant="outline"
          color={COLORS.pharmacy}
          style={{ marginTop: SPACING.xl, width: '60%' }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Your Cart</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · ฿{total} total
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pharmacy info */}
        {pharmacy && (
          <View style={[styles.pharmacyCard, SHADOWS.sm]}>
            <View style={styles.pharmacyIcon}>
              <Ionicons name="storefront-outline" size={22} color={COLORS.pharmacy} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Ordering from</Text>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 2 }}>{pharmacy.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Est. delivery: {pharmacy.deliveryTime}</Text>
              </View>
            </View>
            <Badge text="Open" color={COLORS.success} size="sm" />
          </View>
        )}

        {/* Items */}
        <Text style={styles.sectionTitle}>Items ({cartItems.length})</Text>
        {cartItems.map((item) => (
          <View key={item.id} style={[styles.itemCard, SHADOWS.sm]}>
            <View style={styles.itemIcon}>
              <Ionicons name="medical-outline" size={18} color={COLORS.pharmacy} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>
                ฿{item.price} × {item.qty}
              </Text>
            </View>
            <Text style={{ ...FONTS.h4, color: COLORS.pharmacy }}>฿{item.total}</Text>
          </View>
        ))}

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Order Summary</Text>

          <View style={styles.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Subtotal</Text>
            </View>
            <Text style={styles.value}>฿{subtotal}</Text>
          </View>

          <View style={styles.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Ionicons name="bicycle-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.label}>Delivery Fee</Text>
            </View>
            <Text style={styles.value}>฿{deliveryFee}</Text>
          </View>

          <Divider />

          <View style={styles.row}>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Total</Text>
            <Text style={{ ...FONTS.h3, color: COLORS.pharmacy }}>฿{total}</Text>
          </View>

          <Button
            title={`Place Order — ฿${total}`}
            onPress={handleOrder}
            loading={loading}
            color={COLORS.pharmacy}
            style={{ marginTop: SPACING.lg }}
          />

          <View style={[styles.infoNote, { marginTop: SPACING.md }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.success} />
            <Text style={{ ...FONTS.small, color: COLORS.textSecondary, marginLeft: SPACING.sm, flex: 1 }}>
              Secure payment · Free returns within 24 hours
            </Text>
          </View>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 52,
    paddingBottom: SPACING.sm,
  },
  pharmacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.pharmacy,
  },
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.pharmacy + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.pharmacy + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: { ...FONTS.body, color: COLORS.textSecondary },
  value: { ...FONTS.bodyBold, color: COLORS.text },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.pharmacy + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
