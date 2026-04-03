import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
const typeColor = { approval: COLORS.warning, issue: COLORS.danger, payment: COLORS.info, system: COLORS.success };
const typeIcon = { approval: 'time-outline', issue: 'alert-circle-outline', payment: 'card-outline', system: 'settings-outline' };

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('admin');
  const usersByRole = dashboard?.users_by_role || {};
  const activities = (dashboard?.recent_activity || []).slice(0, 8);

  const totalUsers = dashboard?.total_users ?? 4521;
  const totalDoctors = usersByRole.doctor ?? 156;
  const totalPharmacies = usersByRole.pharmacy ?? 42;
  const totalRevenue = dashboard?.total_revenue ?? 1200000;
  const pendingApprovals = dashboard?.pending_approvals ?? 5;
  const blockedUsers = dashboard?.blocked_users ?? 3;

  const revenueText = `฿${Number(totalRevenue).toLocaleString()}`;

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

      <View style={styles.statsRow}>
        <StatCard label="Total Users" value={String(totalUsers)} color={COLORS.info} icon={<Ionicons name="people-outline" size={16} color={COLORS.info} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Doctors" value={String(totalDoctors)} color={COLORS.doctor} icon={<Ionicons name="medkit-outline" size={16} color={COLORS.doctor} />} />
      </View>
      <View style={[styles.statsRow, { marginTop: SPACING.md }]}>
        <StatCard label="Pharmacies" value={String(totalPharmacies)} color={COLORS.pharmacy} icon={<Ionicons name="medical-outline" size={16} color={COLORS.pharmacy} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Revenue" value={revenueText} color={COLORS.success} icon={<Ionicons name="cash-outline" size={16} color={COLORS.success} />} />
      </View>
      <View style={[styles.statsRow, { marginTop: SPACING.md }]}>
        <StatCard label="Pending" value={String(pendingApprovals)} color={COLORS.warning} icon={<Ionicons name="time-outline" size={16} color={COLORS.warning} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Blocked" value={String(blockedUsers)} color={COLORS.danger} icon={<Ionicons name="ban-outline" size={16} color={COLORS.danger} />} />
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
  statsRow: { flexDirection: 'row', paddingHorizontal: SPACING.xl },
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
