import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 1, label: 'Find Doctor', icon: 'medkit-outline', screen: 'Doctors', color: COLORS.doctor },
  { id: 2, label: 'Buy Medicine', icon: 'medical-outline', screen: 'Pharmacy', color: COLORS.pharmacy },
  { id: 3, label: 'My Bookings', icon: 'calendar-outline', screen: 'Bookings', color: COLORS.info },
  { id: 4, label: 'My Orders', icon: 'cube-outline', screen: 'MyOrders', color: COLORS.warning },
];

const SPECIALTIES = [
  { id: 1, name: 'General', icon: 'pulse-outline' },
  { id: 2, name: 'Cardiology', icon: 'heart-outline' },
  { id: 3, name: 'Pediatrics', icon: 'happy-outline' },
  { id: 4, name: 'Dermatology', icon: 'sparkles-outline' },
  { id: 5, name: 'Psychiatry', icon: 'moon-outline' },
  { id: 6, name: 'Orthopedics', icon: 'walk-outline' },
];

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('general');

  const bookingCount = dashboard?.upcoming_bookings ?? 0;
  const orderCount = dashboard?.active_orders ?? 0;

  const dynamicUpcoming = (dashboard?.bookings || [])
    .filter((b) => ['pending', 'confirmed'].includes(b.status))
    .slice(0, 2)
    .map((b) => ({
      id: b.id,
      doctor: b.doctor?.name || 'Assigned Doctor',
      specialty: b.doctor?.doctor_profile?.specialty || 'Consultation',
      date: `${b.date || ''} ${b.time_slot || ''}`.trim(),
      status: b.status,
    }));

  const upcomingAppointments = dynamicUpcoming;

  const quickActions = QUICK_ACTIONS.map((action) => {
    if (action.screen === 'Bookings') return { ...action, badge: bookingCount };
    if (action.screen === 'MyOrders') return { ...action, badge: orderCount };
    return action;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
            <View style={styles.notifBtn}>
              <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
              <View style={styles.notifDot} />
            </View>
          </TouchableOpacity>
          <AccountQuickMenu navigation={navigation} />
        </View>
      </View>

      {loading && (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.stateText}>Loading your dashboard...</Text>
        </View>
      )}
      {!!error && !loading && (
        <TouchableOpacity style={styles.stateWrap} onPress={refresh}>
          <Text style={styles.stateText}>Could not load latest data. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      {/* Health Banner */}
      <Card style={styles.banner}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...FONTS.h3, color: COLORS.text }}>How are you feeling?</Text>
            <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: 4 }}>
              Book a consultation with top doctors anytime
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Doctors')}
              style={styles.bannerBtn}
            >
              <Text style={{ ...FONTS.captionBold, color: COLORS.textInverse }}>Find a Doctor</Text>
            </TouchableOpacity>
          </View>
          <Ionicons name="medkit-outline" size={56} color={COLORS.accent} />
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        {quickActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate(action.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon} size={22} color={action.color} />
              {Number(action.badge) > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{action.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Specialties */}
      <SectionHeader title="Specialties" actionText="View All" onAction={() => navigation.navigate('Doctors')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
        {SPECIALTIES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.specialtyCard}
            onPress={() => navigation.navigate('Doctors', { specialty: s.name })}
          >
            <Ionicons name={s.icon} size={24} color={COLORS.primary} />
            <Text style={{ ...FONTS.captionBold, color: COLORS.text, marginTop: 6 }}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Upcoming Appointments */}
      <SectionHeader
        title="Upcoming Appointments"
        actionText="See All"
        onAction={() => navigation.navigate('Bookings')}
        style={{ marginTop: SPACING.xl }}
      />
      <View style={{ paddingHorizontal: SPACING.xl }}>
        {!upcomingAppointments.length ? (
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No upcoming appointments</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Book a consultation to see it here.</Text>
          </Card>
        ) : upcomingAppointments.map((apt) => (
          <Card key={apt.id} style={styles.appointmentCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={apt.doctor} size={48} color={COLORS.doctor} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{apt.doctor}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{apt.specialty}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.primary, marginTop: 2 }}>{apt.date}</Text>
              </View>
              <Badge
                text={apt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                color={apt.status === 'confirmed' ? COLORS.success : COLORS.warning}
                size="sm"
              />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
    paddingBottom: SPACING.lg,
  },
  greeting: { ...FONTS.body, color: COLORS.textSecondary },
  userName: { ...FONTS.h2, color: COLORS.text },
  notifBtn: { position: 'relative', padding: 8 },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  banner: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
    padding: SPACING.xl,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  bannerBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: SPACING.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  quickActionBtn: { alignItems: 'center', width: (width - 80) / 4 },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.danger,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.bg,
  },
  quickActionBadgeText: {
    ...FONTS.small,
    color: COLORS.text,
    fontSize: 10,
  },
  quickActionLabel: { ...FONTS.small, color: COLORS.textSecondary, textAlign: 'center' },
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
  specialtyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginRight: SPACING.md,
    width: 90,
    height: 90,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  appointmentCard: { marginBottom: SPACING.md },
});
