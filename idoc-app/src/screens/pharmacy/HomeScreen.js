import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';

export default function PharmacyHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('pharmacy');

  const recentOrders = (dashboard?.recent_orders || dashboard?.orders || [])
    .slice(0, 4)
    .map((order) => ({
      id: order.order_number || order.id,
      customer: order.customer_name || order.customer?.name || 'Customer',
      items: order.items?.length || order.item_count || 0,
      total: Number(order.total_amount || order.total || 0),
      status: order.status || 'new',
      time: order.created_at ? String(order.created_at).slice(0, 16) : 'Recently',
    }));

  const newOrders = dashboard?.new_orders ?? 3;
  const todayRevenue = dashboard?.today_revenue ?? 2450;
  const totalOrders = dashboard?.total_orders ?? 156;
  const totalMedicines = dashboard?.total_medicines ?? 1200;

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
        <TouchableOpacity style={styles.stateWrap} onPress={refresh}>
          <Text style={styles.stateText}>Could not load dashboard. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        <StatCard label="New Orders" value={String(newOrders)} color={COLORS.danger} icon={<Ionicons name="ellipse" size={14} color={COLORS.danger} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Today's Sales" value={`฿${Number(todayRevenue).toLocaleString()}`} color={COLORS.success} icon={<Ionicons name="cash-outline" size={16} color={COLORS.success} />} />
      </View>
      <View style={[styles.statsRow, { marginTop: SPACING.md }]}>
        <StatCard label="Total Orders" value={String(totalOrders)} color={COLORS.info} icon={<Ionicons name="cube-outline" size={16} color={COLORS.info} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Medicines" value={String(totalMedicines)} color={COLORS.pharmacy} icon={<Ionicons name="medical-outline" size={16} color={COLORS.pharmacy} />} />
      </View>

      <SectionHeader title="Recent Orders" actionText="View All" onAction={() => navigation.navigate('Orders')} style={{ marginTop: SPACING.xl }} />
      <View style={{ paddingHorizontal: SPACING.xl }}>
        {!recentOrders.length ? (
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No recent orders</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Incoming orders will appear here.</Text>
          </Card>
        ) : recentOrders.map((order) => (
          <Card key={order.id} style={{ marginBottom: SPACING.md }}>
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
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.xl },
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
