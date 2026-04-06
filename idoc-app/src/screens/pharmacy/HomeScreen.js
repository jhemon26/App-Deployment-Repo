import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
import { orderAPI, pharmacyAPI } from '../../services/api';

const normalizeStatus = (value) => String(value || '').toLowerCase().trim();
const getRows = (payload) => (Array.isArray(payload) ? payload : payload?.results || []);

export default function PharmacyHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('pharmacy');
  const { width } = useWindowDimensions();
  const compact = width < 900;

  const [liveOrders, setLiveOrders] = useState(null);
  const [liveMedicineCount, setLiveMedicineCount] = useState(null);

  const loadLiveCounts = React.useCallback(async () => {
    try {
      const [ordersResp, medsResp] = await Promise.all([
        orderAPI.list(),
        pharmacyAPI.getMedicines(),
      ]);

      const orders = getRows(ordersResp?.data);
      const medicines = getRows(medsResp?.data);

      setLiveOrders(orders);
      setLiveMedicineCount(medicines.length);
    } catch (e) {
      // Keep dashboard fallback values if live endpoints fail.
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadLiveCounts();
    }, [loadLiveCounts])
  );

  const sourceOrders = useMemo(
    () => (liveOrders !== null ? liveOrders : (dashboard?.orders || dashboard?.recent_orders || [])),
    [liveOrders, dashboard]
  );

  const recentOrders = sourceOrders
    .slice(0, 4)
    .map((order) => ({
      id: order.order_number || order.id,
      customer: order.customer_name || order.customer?.name || 'Customer',
      items: order.items?.length || order.item_count || 0,
      total: Number(order.total_amount || order.total || 0),
      status: normalizeStatus(order.status || 'new'),
      time: order.created_at ? String(order.created_at).slice(0, 16) : 'Recently',
    }));

  const statusCounts = dashboard?.order_status_counts || dashboard?.status_counts || {};
  const hasLiveOrders = liveOrders !== null;

  const derivedCounts = useMemo(() => ({
    newOrders: sourceOrders.filter((o) => normalizeStatus(o.status) === 'new').length,
    preparingOrders: sourceOrders.filter((o) => normalizeStatus(o.status) === 'preparing').length,
    readyOrders: sourceOrders.filter((o) => normalizeStatus(o.status) === 'ready').length,
  }), [sourceOrders]);

  const newOrders = Number(hasLiveOrders ? derivedCounts.newOrders : (statusCounts.new ?? derivedCounts.newOrders));
  const preparingOrders = Number(hasLiveOrders ? derivedCounts.preparingOrders : (statusCounts.preparing ?? derivedCounts.preparingOrders));
  const readyOrders = Number(hasLiveOrders ? derivedCounts.readyOrders : (statusCounts.ready ?? derivedCounts.readyOrders));

  const todayKey = new Date().toISOString().slice(0, 10);
  const derivedTodayRevenue = sourceOrders
    .filter((o) => normalizeStatus(o.status) === 'delivered' && String(o.created_at || '').slice(0, 10) === todayKey)
    .reduce((sum, o) => sum + Number(o.total_amount || o.total || 0), 0);

  const todayRevenue = Number(hasLiveOrders ? derivedTodayRevenue : (dashboard?.today_revenue ?? derivedTodayRevenue));

  const totalMedicines = Number(liveMedicineCount ?? dashboard?.total_medicines ?? 0);

  const openOrders = (initialTab) => navigation.navigate('Orders', { initialTab, requestRefreshAt: Date.now() });

  const handleRefreshAll = async () => {
    refresh();
    await loadLiveCounts();
  };

  const quickActions = useMemo(() => ([
    { key: 'orders', label: 'Orders', icon: 'cube-outline', color: COLORS.pharmacy, onPress: () => openOrders('All') },
    { key: 'inventory', label: 'Inventory', icon: 'medical-outline', color: COLORS.info, onPress: () => navigation.navigate('Inventory') },
    { key: 'profile', label: 'Profile', icon: 'person-outline', color: COLORS.success, onPress: () => navigation.navigate('Profile') },
    { key: 'refresh', label: 'Refresh', icon: 'refresh-outline', color: COLORS.warning, onPress: handleRefreshAll },
  ]), [navigation, refresh, loadLiveCounts]);

  const statCards = useMemo(() => ([
    {
      key: 'new',
      label: 'New Orders',
      value: String(newOrders),
      color: COLORS.danger,
      icon: <Ionicons name="ellipse" size={14} color={COLORS.danger} />,
      onPress: () => openOrders('New'),
    },
    {
      key: 'preparing',
      label: 'Preparing',
      value: String(preparingOrders),
      color: COLORS.warning,
      icon: <Ionicons name="construct-outline" size={16} color={COLORS.warning} />,
      onPress: () => openOrders('Preparing'),
    },
    {
      key: 'ready',
      label: 'Ready Pickup',
      value: String(readyOrders),
      color: COLORS.success,
      icon: <Ionicons name="checkmark-done-outline" size={16} color={COLORS.success} />,
      onPress: () => openOrders('Ready'),
    },
    {
      key: 'sales',
      label: "Today's Sales",
      value: `฿${Number(todayRevenue).toLocaleString()}`,
      color: COLORS.pharmacy,
      icon: <Ionicons name="cash-outline" size={16} color={COLORS.pharmacy} />,
      onPress: () => openOrders('Delivered'),
    },
  ]), [newOrders, preparingOrders, readyOrders, todayRevenue]);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary }}>Welcome back,</Text>
          <Text style={{ ...FONTS.h2, color: COLORS.text }}>{user?.name || 'Pharmacy'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <AccountQuickMenu navigation={navigation} />
        </View>
      </View>

      {loading && (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading pharmacy dashboard...</Text>
        </View>
      )}
      {!!error && !loading && (
        <TouchableOpacity style={styles.stateWrap} onPress={handleRefreshAll}>
          <Text style={styles.stateText}>Could not load dashboard. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.key} style={styles.quickActionBtn} onPress={action.onPress}>
            <Ionicons name={action.icon} size={16} color={action.color} />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.statsGrid, compact && styles.statsGridCompact]}>
        {statCards.map((card) => (
          <TouchableOpacity key={card.key} activeOpacity={0.8} style={styles.statCardTap} onPress={card.onPress}>
            <StatCard style={styles.statCard} label={card.label} value={card.value} color={card.color} icon={card.icon} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginTop: 2 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Inventory')}
          style={styles.medicineStrip}
        >
          <Ionicons name="medical-outline" size={16} color={COLORS.info} />
          <Text style={styles.medicineStripText}>Total medicines in stock: {totalMedicines}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <SectionHeader title="Recent Orders" actionText="View All" onAction={() => openOrders('All')} style={{ marginTop: SPACING.xl }} />
      <View style={{ paddingHorizontal: SPACING.xl }}>
        {!recentOrders.length ? (
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No recent orders</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Incoming orders will appear here.</Text>
          </Card>
        ) : recentOrders.map((order) => (
          <Card key={order.id} style={{ marginBottom: SPACING.md }} onPress={() => openOrders('All')}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ ...FONTS.captionBold, color: COLORS.textMuted }}>{order.id}</Text>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 2 }}>{order.customer}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{order.items} items • {order.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge
                  text={order.status}
                  color={order.status === 'new' ? COLORS.danger : order.status === 'preparing' ? COLORS.warning : COLORS.success}
                  size="sm"
                />
                <Text style={{ ...FONTS.bodyBold, color: COLORS.pharmacy, marginTop: 8 }}>฿{order.total}</Text>
              </View>
            </View>
          </Card>
        ))}
      </View>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quickActionText: { ...FONTS.captionBold, color: COLORS.text, marginLeft: 6 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
  },
  statsGridCompact: {
    gap: SPACING.md,
  },
  statCardTap: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  statCard: {
    width: '100%',
    marginBottom: 0,
  },
  medicineStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  medicineStripText: { ...FONTS.captionBold, color: COLORS.text, flex: 1, marginLeft: 8 },
  stateWrap: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  stateText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 6 },
});
