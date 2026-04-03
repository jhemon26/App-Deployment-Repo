import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Badge, Button, Card, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const TRACKING = [
  { id: 1, label: 'Order placed', time: 'Today, 10:10 AM', done: true },
  { id: 2, label: 'Packed by pharmacy', time: 'Today, 11:05 AM', done: true },
  { id: 3, label: 'Out for delivery', time: 'Today, 2:30 PM', done: false },
  { id: 4, label: 'Delivered', time: 'Pending', done: false },
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

  const handleAction = (label) => {
    Toast.show({ type: 'info', text1: label, text2: `${order.id} updated locally for now.` });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={order.pharmacy} size={64} color={COLORS.pharmacy} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={{ ...FONTS.h3, color: COLORS.text }}>{order.id}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{order.pharmacy}</Text>
            <Text style={{ ...FONTS.small, color: COLORS.primary, marginTop: 4 }}>{order.items} items • {order.date}</Text>
          </View>
          <Badge text={order.status} color={COLORS.warning} size="sm" />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.row}><Text style={styles.label}>Items</Text><Text style={styles.value}>{order.items}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={styles.value}>{order.status}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Total</Text><Text style={styles.value}>฿{order.total}</Text></View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Tracking Timeline</Text>
        {TRACKING.map((step, index) => (
          <View key={step.id} style={{ marginBottom: index === TRACKING.length - 1 ? 0 : SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: step.done ? COLORS.success : COLORS.border }]} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{step.label}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{step.time}</Text>
              </View>
            </View>
            {index < TRACKING.length - 1 && <View style={styles.line} />}
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button title="Track" onPress={() => handleAction('Track')} style={{ flex: 1 }} />
          <Button title="Reorder" variant="outline" color={COLORS.pharmacy} onPress={() => handleAction('Reorder')} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button title="Contact Pharmacy" variant="outline" color={COLORS.info} onPress={() => navigation.navigate('ChatRoom', { recipient: { name: order.pharmacy } })} style={{ flex: 1 }} />
          <Button title="View Receipt" variant="outline" color={COLORS.primary} onPress={() => handleAction('Receipt')} style={{ flex: 1 }} />
        </View>
      </Card>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  hero: { marginHorizontal: SPACING.xl, marginTop: 60 },
  section: { marginHorizontal: SPACING.xl, marginTop: SPACING.lg },
  sectionTitle: { ...FONTS.h4, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.lg, marginTop: SPACING.sm },
  label: { ...FONTS.body, color: COLORS.textSecondary, flex: 1 },
  value: { ...FONTS.bodyBold, color: COLORS.text, flex: 1, textAlign: 'right' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, height: 22, backgroundColor: COLORS.border, marginLeft: 6 },
});