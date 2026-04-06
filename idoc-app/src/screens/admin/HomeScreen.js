import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';

const typeColor = { approval: COLORS.warning, issue: COLORS.danger, payment: COLORS.info, system: COLORS.success };
const typeIcon = { approval: 'time-outline', issue: 'alert-circle-outline', payment: 'card-outline', system: 'settings-outline' };

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('admin');
  const { width } = useWindowDimensions();
  const compact = width < 980;
  const usersByRole = dashboard?.users_by_role || {};
  const activities = (dashboard?.recent_activity || []).slice(0, 8);

  const totalUsers = Number(dashboard?.total_users ?? 0);
  const totalDoctors = Number(usersByRole.doctor ?? dashboard?.total_doctors ?? 0);
  const totalPharmacies = Number(usersByRole.pharmacy ?? dashboard?.total_pharmacies ?? 0);
  const totalRevenueValue = Number(dashboard?.total_revenue ?? dashboard?.revenue ?? 0);
  const pendingApprovals = Number(dashboard?.pending_approvals ?? 0);
  const blockedUsers = Number(dashboard?.blocked_users ?? 0);

  const revenueText = `฿${Number.isFinite(totalRevenueValue) ? totalRevenueValue.toLocaleString() : '0'}`;

  const goUsers = (initialTab) => {
    navigation.navigate('Users', {
      initialTab,
      requestRefreshAt: Date.now(),
    });
  };

  const statPress = {
    totalUsers: () => goUsers('All'),
    doctors: () => goUsers('Doctors'),
    pharmacies: () => goUsers('Pharmacies'),
    revenue: () => refresh(),
    pending: () => navigation.navigate('Approvals', { initialFilter: 'all', requestRefreshAt: Date.now() }),
    blocked: () => goUsers('Blocked'),
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary }}>Admin Panel</Text>
          <Text style={{ ...FONTS.h2, color: COLORS.text }}>{user?.name || 'Admin'}</Text>
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
          <Text style={styles.stateText}>Loading admin metrics...</Text>
        </View>
      )}
      {!!error && !loading && (
        <TouchableOpacity style={styles.stateWrap} onPress={refresh}>
          <Text style={styles.stateText}>Could not load dashboard. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('Approvals', { initialFilter: 'all', requestRefreshAt: Date.now() })}
        >
          <Ionicons name="checkmark-done-outline" size={16} color={COLORS.warning} />
          <Text style={styles.quickActionText}>Approvals Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => goUsers('All')}>
          <Ionicons name="people-outline" size={16} color={COLORS.info} />
          <Text style={styles.quickActionText}>Manage Users</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Notifications')}>
          <Ionicons name="notifications-outline" size={16} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Alerts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={refresh}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.success} />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsGrid, compact && styles.statsGridCompact]}>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={statPress.totalUsers}>
          <StatCard style={styles.statCard} label="Total Users" value={String(totalUsers)} color={COLORS.info} icon={<Ionicons name="people-outline" size={16} color={COLORS.info} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={statPress.doctors}>
          <StatCard style={styles.statCard} label="Doctors" value={String(totalDoctors)} color={COLORS.doctor} icon={<Ionicons name="medkit-outline" size={16} color={COLORS.doctor} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={statPress.pharmacies}>
          <StatCard style={styles.statCard} label="Pharmacies" value={String(totalPharmacies)} color={COLORS.pharmacy} icon={<Ionicons name="medical-outline" size={16} color={COLORS.pharmacy} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={statPress.revenue}>
          <StatCard style={styles.statCard} label="Revenue" value={revenueText} color={COLORS.success} icon={<Ionicons name="cash-outline" size={16} color={COLORS.success} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={statPress.pending}>
          <StatCard style={styles.statCard} label="Pending" value={String(pendingApprovals)} color={COLORS.warning} icon={<Ionicons name="time-outline" size={16} color={COLORS.warning} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={statPress.blocked}>
          <StatCard style={styles.statCard} label="Blocked" value={String(blockedUsers)} color={COLORS.danger} icon={<Ionicons name="ban-outline" size={16} color={COLORS.danger} />} />
        </TouchableOpacity>
      </View>

      <SectionHeader title="Recent Activity" actionText="Refresh" onAction={refresh} style={{ marginTop: SPACING.xl }} />
      <View style={{ paddingHorizontal: SPACING.xl }}>
        {!activities.length ? (
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No recent activity</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Moderation and system events will show up here.</Text>
          </Card>
        ) : activities.map((activity) => (
          <Card key={activity.id} style={{ marginBottom: SPACING.sm, padding: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: typeColor[activity.type] + '15', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md }}>
                <Ionicons name={typeIcon[activity.type] || 'ellipsis-horizontal'} size={16} color={typeColor[activity.type] || COLORS.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...FONTS.caption, color: COLORS.text }}>{activity.text || activity.message}</Text>
                <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 2 }}>{activity.time || activity.created_at || 'Just now'}</Text>
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
    borderRadius: 999,
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
  stateWrap: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  stateText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 6 },
});
