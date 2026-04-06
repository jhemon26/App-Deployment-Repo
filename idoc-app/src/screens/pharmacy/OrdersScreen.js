import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Badge, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { orderAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'New', 'Preparing', 'Ready', 'Delivered'];
const statusColor = {
  new: COLORS.danger,
  preparing: COLORS.warning,
  ready: COLORS.success,
  delivered: COLORS.info,
};

const normalizeStatus = (value) => String(value || '').toLowerCase().trim();
const normalizeTab = (value) => {
  if (!value) return 'All';
  const match = TABS.find((t) => t.toLowerCase() === String(value).toLowerCase());
  return match || 'All';
};

export default function PharmacyOrdersScreen({ route }) {
  const [tab, setTab] = useState(normalizeTab(route?.params?.initialTab));
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
        status: normalizeStatus(order.status),
        time: order.created_at ? String(order.created_at).slice(0, 16) : 'Recently',
        rawDate: order.created_at ? String(order.created_at).slice(0, 10) : '',
        prescription: !!order.prescription,
      }));
      setOrders(mapped);
    } catch (err) {
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

  useEffect(() => {
    const nextTab = normalizeTab(route?.params?.initialTab);
    if (nextTab !== tab) setTab(nextTab);

    if (route?.params?.requestRefreshAt) {
      loadOrders({ silent: true });
    }
  }, [route?.params?.initialTab, route?.params?.requestRefreshAt]);

  const filtered = useMemo(() => orders.filter((o) => tab === 'All' || normalizeStatus(o.status) === tab.toLowerCase()), [orders, tab]);

  const newOrdersCount = orders.filter((o) => normalizeStatus(o.status) === 'new').length;
  const totalRevenue = orders
    .filter((o) => normalizeStatus(o.status) === 'delivered')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRevenue = orders
    .filter((o) => normalizeStatus(o.status) === 'delivered' && o.rawDate === todayKey)
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, { status: newStatus });
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: normalizeStatus(newStatus) } : order))
      );
      Toast.show({ type: 'success', text1: 'Order updated', text2: `Status changed to ${newStatus}` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.response?.data?.error || 'Please try again' });
    }
  };

  const renderOrderCard = ({ item }) => {
    const sColor = statusColor[item.status] || COLORS.textMuted;
    const itemsText = item.items.length > 0 ? item.items.join(', ') : 'No items';

    return (
      <View style={[styles.card, { borderLeftColor: sColor }, SHADOWS.sm]}>
        <View style={styles.primaryRow}>
          <View style={styles.leftCol}>
            <View style={styles.tagRow}>
              <Text style={styles.orderNumber}>#{String(item.number).slice(-8)}</Text>
              {item.prescription && (
                <View style={styles.rxBadge}>
                  <Text style={styles.rxText}>Rx</Text>
                </View>
              )}
              <Badge text={item.status} color={sColor} size="sm" />
            </View>

            <Text style={styles.customerName}>{item.customer}</Text>
            <Text style={styles.itemText} numberOfLines={2}>{itemsText}</Text>

            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.total}>฿{item.total}</Text>
          </View>
        </View>

        <View style={styles.actionArea}>
          {item.status === 'new' && (
            <Button
              title="Accept and Prepare"
              size="sm"
              color={COLORS.pharmacy}
              onPress={() => updateStatus(item.id, 'preparing')}
            />
          )}
          {item.status === 'preparing' && (
            <Button
              title="Mark as Ready"
              size="sm"
              color={COLORS.success}
              onPress={() => updateStatus(item.id, 'ready')}
            />
          )}
          {item.status === 'ready' && (
            <Button
              title="Mark as Delivered"
              size="sm"
              color={COLORS.info}
              onPress={() => updateStatus(item.id, 'delivered')}
            />
          )}
          {item.status === 'delivered' && (
            <View style={styles.deliveredChip}>
              <Ionicons name="checkmark-circle" size={15} color={COLORS.info} />
              <Text style={styles.deliveredText}>Delivered · ฿{item.total} collected</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.pageTitle}>Orders</Text>
            <Text style={styles.pageSubtitle}>{orders.length} total orders</Text>
          </View>

          <View style={styles.revenueBox}>
            <Ionicons name="cash-outline" size={13} color={COLORS.pharmacy} />
            <View style={{ marginLeft: SPACING.xs }}>
              <Text style={styles.revenueLabel}>Revenue</Text>
              <Text style={styles.revenueValue}>฿{totalRevenue.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoStrip}>
          {newOrdersCount > 0 && (
            <View style={styles.newBadge}>
              <Ionicons name="alert-circle" size={11} color={COLORS.danger} />
              <Text style={styles.newBadgeText}>{newOrdersCount} new</Text>
            </View>
          )}
          {todayRevenue > 0 && (
            <Text style={styles.todayRevenueText}>Today: ฿{todayRevenue.toLocaleString()}</Text>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map((item) => {
            const active = tab === item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => setTab(item)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.pharmacy} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => loadOrders({ silent: true })}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.pharmacy + '20' }]}> 
                <Ionicons name="cube-outline" size={28} color={COLORS.pharmacy} />
              </View>
              <Text style={styles.emptyTitle}>
                {loadError ? 'Could not load orders' : tab === 'All' ? 'No orders yet' : `No ${tab.toLowerCase()} orders`}
              </Text>
              <Text style={styles.emptyText}>
                {loadError ? 'Pull down to retry.' : 'Incoming orders will appear here.'}
              </Text>
            </View>
          }
          renderItem={renderOrderCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  headerCard: {
    marginHorizontal: SPACING.xl,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pageTitle: { ...FONTS.h2, color: COLORS.text },
  pageSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },

  revenueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.pharmacy + '15',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.pharmacy + '30',
  },
  revenueLabel: { ...FONTS.small, color: COLORS.textMuted },
  revenueValue: { ...FONTS.captionBold, color: COLORS.pharmacy },

  infoStrip: { flexDirection: 'row', alignItems: 'center', marginTop: 8, columnGap: SPACING.sm },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '15',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  newBadgeText: { ...FONTS.captionBold, color: COLORS.danger, marginLeft: 4 },
  todayRevenueText: { ...FONTS.captionBold, color: COLORS.success },

  tabBar: { paddingTop: 8, paddingBottom: 2 },
  tabChip: {
    height: 30,
    minHeight: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  tabChipActive: { backgroundColor: COLORS.pharmacy, borderColor: COLORS.pharmacy },
  tabChipText: { ...FONTS.captionBold, color: COLORS.textSecondary },
  tabChipTextActive: { color: COLORS.textInverse },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxl },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 84 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  leftCol: { flex: 1, marginRight: SPACING.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: SPACING.sm, rowGap: 4 },
  orderNumber: { ...FONTS.captionBold, color: COLORS.textMuted },
  rxBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.warning + '20',
    borderWidth: 1,
    borderColor: COLORS.warning + '50',
  },
  rxText: { ...FONTS.captionBold, color: COLORS.warning, fontSize: 10 },

  customerName: { ...FONTS.bodyBold, color: COLORS.text, marginTop: 6 },
  itemText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 3 },
  timeRow: { flexDirection: 'row', alignItems: 'center', columnGap: 4, marginTop: 3 },
  timeText: { ...FONTS.small, color: COLORS.textMuted },

  rightCol: { alignItems: 'flex-end' },
  total: { ...FONTS.captionBold, color: COLORS.pharmacy, marginTop: 1 },

  actionArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.sm },
  deliveredChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.info + '15',
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
  },
  deliveredText: { ...FONTS.captionBold, color: COLORS.info, marginLeft: 6 },

  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
