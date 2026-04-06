import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Badge, Button, Card } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const statusMap = {
  processing: { label: 'Processing', color: COLORS.warning },
  preparing: { label: 'Preparing', color: COLORS.warning },
  on_the_way: { label: 'On the Way', color: COLORS.info },
  ready: { label: 'Ready', color: COLORS.success },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.danger },
};

const getTracking = (status) => [
  { id: 1, label: 'Order Placed', sub: 'Your order was received', done: true },
  { id: 2, label: 'Packed', sub: 'Pharmacy is preparing', done: ['preparing', 'ready', 'on_the_way', 'delivered'].includes(status) },
  { id: 3, label: 'Out for Delivery', sub: 'On the way to you', done: ['on_the_way', 'delivered'].includes(status) },
  { id: 4, label: 'Delivered', sub: 'Order completed', done: status === 'delivered' },
];

export default function OrderDetailScreen({ navigation, route }) {
  const order = route?.params?.order || {
    id: 'ORD-001',
    pharmacy: 'MedPlus Pharmacy',
    items: 3,
    total: 255,
    status: 'processing',
    date: '2026-04-03',
  };

  const s = statusMap[order.status] || { label: order.status, color: COLORS.textMuted };
  const tracking = getTracking(order.status);

  const handleAction = (label) => {
    Toast.show({ type: 'info', text1: label, text2: `${order.id} updated locally for now.` });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Card */}
      <View style={[styles.heroCard, { borderLeftColor: s.color }, SHADOWS.md]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.heroIcon, { backgroundColor: COLORS.pharmacy + '20' }]}>
            <Ionicons name="storefront-outline" size={30} color={COLORS.pharmacy} />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={{ ...FONTS.captionBold, color: COLORS.textMuted }}>{order.id}</Text>
            <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: 2 }}>{order.pharmacy}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 3 }}>
              {order.items} {order.items === 1 ? 'item' : 'items'} • {order.date}
            </Text>
          </View>
          <Badge text={s.label} color={s.color} size="sm" />
        </View>
      </View>

      {/* Order Summary */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        {[
          { label: 'Items', value: `${order.items} ${order.items === 1 ? 'item' : 'items'}`, icon: 'cube-outline' },
          { label: 'Status', value: s.label, icon: 'flag-outline', valueColor: s.color },
          { label: 'Date', value: order.date, icon: 'calendar-outline' },
        ].map((row, index) => (
          <View key={index} style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.pharmacy + '15' }]}>
              <Ionicons name={row.icon} size={14} color={COLORS.pharmacy} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted }}>{row.label}</Text>
              <Text style={{ ...FONTS.bodyBold, color: row.valueColor || COLORS.text, marginTop: 2 }}>{row.value}</Text>
            </View>
          </View>
        ))}
        {/* Total */}
        <View style={[styles.totalRow]}>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary }}>Order Total</Text>
          <Text style={{ ...FONTS.h3, color: COLORS.pharmacy }}>฿{order.total}</Text>
        </View>
      </Card>

      {/* Tracking Timeline */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking Timeline</Text>
        <View style={{ marginTop: SPACING.md }}>
          {tracking.map((step, index) => (
            <View key={step.id} style={{ flexDirection: 'row' }}>
              {/* Dot + line column */}
              <View style={{ alignItems: 'center', width: 24 }}>
                <View style={[styles.dot, {
                  backgroundColor: step.done ? COLORS.success : 'transparent',
                  borderColor: step.done ? COLORS.success : COLORS.border,
                }]}>
                  {step.done && <Ionicons name="checkmark" size={10} color={COLORS.text} />}
                </View>
                {index < tracking.length - 1 && (
                  <View style={[styles.line, { backgroundColor: step.done ? COLORS.success + '50' : COLORS.border }]} />
                )}
              </View>
              {/* Label + sub */}
              <View style={{ flex: 1, marginLeft: SPACING.md, paddingBottom: index < tracking.length - 1 ? SPACING.lg : 0 }}>
                <Text style={{ ...FONTS.bodyBold, color: step.done ? COLORS.text : COLORS.textMuted }}>
                  {step.label}
                </Text>
                <Text style={{ ...FONTS.caption, color: step.done ? COLORS.textSecondary : COLORS.textMuted, marginTop: 2 }}>
                  {step.sub}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Actions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button
            title="Track Order"
            onPress={() => handleAction('Track')}
            style={{ flex: 1 }}
          />
          <Button
            title="Reorder"
            variant="outline"
            color={COLORS.pharmacy}
            onPress={() => handleAction('Reorder')}
            style={{ flex: 1 }}
          />
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button
            title="Contact Pharmacy"
            variant="outline"
            color={COLORS.info}
            onPress={() => navigation.navigate('ChatRoom', { recipient: { name: order.pharmacy } })}
            style={{ flex: 1 }}
          />
          <Button
            title="View Receipt"
            variant="outline"
            color={COLORS.primary}
            onPress={() => handleAction('Receipt')}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
});
