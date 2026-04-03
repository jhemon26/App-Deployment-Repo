import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Button, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
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
        <Ionicons name="cart-outline" size={56} color={COLORS.textMuted} />
        <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: SPACING.lg }}>Cart is Empty</Text>
        <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm }}>Add some medicines first</Text>
        <Button title="Browse Medicines" onPress={() => navigation.goBack()} variant="outline" style={{ marginTop: SPACING.xl, width: '60%' }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {pharmacy && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.captionBold, color: COLORS.textSecondary }}>Ordering from</Text>
          <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 4 }}>{pharmacy.name}</Text>
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Est. delivery: {pharmacy.deliveryTime}</Text>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Items ({cartItems.length})</Text>
      {cartItems.map((item) => (
        <Card key={item.id} style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>฿{item.price} × {item.qty}</Text>
            </View>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.pharmacy }}>฿{item.total}</Text>
          </View>
        </Card>
      ))}

      <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.lg }}>
        <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Order Summary</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Subtotal</Text>
          <Text style={styles.value}>฿{subtotal}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Delivery Fee</Text>
          <Text style={styles.value}>฿{deliveryFee}</Text>
        </View>
        <Divider />
        <View style={styles.row}>
          <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Total</Text>
          <Text style={{ ...FONTS.h3, color: COLORS.pharmacy }}>฿{total}</Text>
        </View>
        <Button title={`Place Order - ฿${total}`} onPress={handleOrder} loading={loading} color={COLORS.pharmacy} style={{ marginTop: SPACING.lg }} />
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  sectionTitle: { ...FONTS.h4, color: COLORS.text, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl, marginBottom: SPACING.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  label: { ...FONTS.body, color: COLORS.textSecondary },
  value: { ...FONTS.bodyBold, color: COLORS.text },
});
