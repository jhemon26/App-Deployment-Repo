import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Badge, EmptyState, Chip, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
import Toast from 'react-native-toast-message';

const statusMap = {
  processing: { label: 'Processing', color: COLORS.warning },
  on_the_way: { label: 'On the Way', color: COLORS.info },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.danger },
};

export default function MyOrdersScreen({ navigation }) {
  const { dashboard, loading, error, refresh } = useRoleDashboard('general');
  const [tab, setTab] = useState('All');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const liveOrders = (dashboard?.orders || []).map((order) => ({
      id: order.id,
      pharmacy: order.pharmacy?.pharmacy_name || order.pharmacy?.name || 'Assigned Pharmacy',
      items: order.items?.length || order.item_count || 1,
      total: Number(order.total_amount || order.total || 0),
      status: order.status,
      date: order.created_at ? String(order.created_at).slice(0, 10) : 'Today',
    }));

    setOrders(liveOrders);
  }, [dashboard]);

  const filtered = useMemo(() => {
    if (tab === 'All') return orders;
    return orders.filter((order) => order.status === tab.toLowerCase());
  }, [orders, tab]);

  const trackOrder = (order) => {
    Toast.show({ type: 'info', text1: 'Tracking order', text2: `${order.id} is currently ${statusMap[order.status]?.label || order.status}` });
  };

  const reorder = (order) => {
    Toast.show({ type: 'success', text1: 'Reorder started', text2: `${order.pharmacy} items were added back to your cart` });
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md }}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>My Orders</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Track medicine deliveries and reorder from your history.</Text>
      </View>

      <FlatList
        horizontal
        data={['All', 'processing', 'on_the_way', 'delivered', 'cancelled']}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}
        renderItem={({ item }) => <Chip label={item === 'All' ? 'All' : statusMap[item].label} active={tab === (item === 'All' ? 'All' : item)} onPress={() => setTab(item === 'All' ? 'All' : item)} />}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 100 }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: SPACING.xxxl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <TouchableOpacity style={styles.retryBox} onPress={refresh}>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Could not load orders. Tap to retry.</Text>
            </TouchableOpacity>
          ) : (
            <EmptyState title="No orders yet" message="Your medicine orders will appear here" icon={<Ionicons name="cube-outline" size={46} color={COLORS.textMuted} />} />
          )
        }
        renderItem={({ item }) => {
          const s = statusMap[item.status];
          return (
            <Card style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...FONTS.captionBold, color: COLORS.textMuted }}>{item.id}</Text>
                  <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 4 }}>{item.pharmacy}</Text>
                  <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>{item.items} items • {item.date}</Text>
                </View>
                <Badge text={s.label} color={s.color} size="sm" />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Order Total</Text>
                <Text style={{ ...FONTS.h4, color: COLORS.pharmacy }}>฿{item.total}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Button title="Track" size="sm" variant="outline" color={COLORS.info} onPress={() => trackOrder(item)} style={{ flex: 1 }} />
                {item.status !== 'delivered' && <Button title="Reorder" size="sm" color={COLORS.pharmacy} onPress={() => reorder(item)} style={{ flex: 1 }} />}
              </View>
              <View style={{ marginTop: SPACING.sm }}>
                <Button title="View Details" size="sm" variant="outline" color={COLORS.primary} onPress={() => navigation.navigate('OrderDetail', { order: item })} />
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  retryBox: {
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bgElevated,
    padding: SPACING.md,
    alignItems: 'center',
  },
});
