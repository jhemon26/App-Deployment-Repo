import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Card, Badge, Chip, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { orderAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'New', 'Preparing', 'Ready', 'Delivered'];
const statusColor = { new: COLORS.danger, preparing: COLORS.warning, ready: COLORS.success, delivered: COLORS.info };

export default function PharmacyOrdersScreen() {
  const [tab, setTab] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadOrders = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setLoadError(false);
    try {
      const { data } = await orderAPI.list();
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((order) => ({
        id: order.id,
        number: order.order_number || order.id,
        customer: order.customer_name || 'Customer',
        items: order.items?.map((item) => `${item.medicine_name || 'Medicine'} x${item.quantity}`) || [],
        total: order.total || 0,
        status: order.status,
        time: order.created_at ? String(order.created_at).slice(0, 16) : 'Recently',
        prescription: !!order.prescription,
      }));
      setOrders(mapped);
    } catch (error) {
      setOrders([]);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filtered = useMemo(() => orders.filter((o) => tab === 'All' || o.status === tab.toLowerCase()), [orders, tab]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, { status: newStatus });
      setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)));
      Toast.show({ type: 'success', text1: `Order ${orderId}`, text2: `Status updated to ${newStatus}` });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: error.response?.data?.error || 'Please try again' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Orders</Text>
      </View>

      <FlatList
        horizontal data={TABS} keyExtractor={(i) => i} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}
        renderItem={({ item }) => <Chip label={item} active={tab === item} onPress={() => setTab(item)} color={COLORS.pharmacy} />}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxxl }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        onRefresh={() => loadOrders({ silent: true })}
        refreshing={refreshing}
        ListEmptyComponent={
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{loadError ? 'Could not load orders' : 'No orders in this status'}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
              {loadError ? 'Pull down to retry loading orders.' : 'Incoming pharmacy orders will appear here.'}
            </Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Text style={{ ...FONTS.captionBold, color: COLORS.textMuted }}>{item.number || item.id}</Text>
                  {item.prescription && <Badge text="Rx" color={COLORS.warning} size="sm" />}
                </View>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 4 }}>{item.customer}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{item.items.join(', ')}</Text>
                <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 4 }}>{item.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge text={item.status} color={statusColor[item.status]} size="sm" />
                <Text style={{ ...FONTS.h4, color: COLORS.pharmacy, marginTop: 8 }}>฿{item.total}</Text>
              </View>
            </View>
            {item.status !== 'delivered' && (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                {item.status === 'new' && <Button title="Accept & Prepare" size="sm" onPress={() => updateStatus(item.id, 'preparing')} color={COLORS.pharmacy} style={{ flex: 1 }} />}
                {item.status === 'preparing' && <Button title="Mark Ready" size="sm" onPress={() => updateStatus(item.id, 'ready')} color={COLORS.success} style={{ flex: 1 }} />}
                {item.status === 'ready' && <Button title="Mark Delivered" size="sm" onPress={() => updateStatus(item.id, 'delivered')} color={COLORS.info} style={{ flex: 1 }} />}
              </View>
            )}
          </Card>
        )}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
});
