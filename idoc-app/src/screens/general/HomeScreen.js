import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, Avatar, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { chatAPI } from '../../services/api';
import useRoleDashboard from '../../hooks/useRoleDashboard';

const QUICK_ACTIONS = [
  { id: 1, label: 'Online Now', icon: 'radio-outline', action: 'online_now', color: COLORS.success },
  { id: 2, label: 'Urgent Request', icon: 'flash-outline', action: 'urgent_request', color: COLORS.danger },
  { id: 3, label: 'My Bookings', icon: 'calendar-outline', screen: 'Bookings', color: COLORS.warning },
  { id: 4, label: 'Buy Medicine', icon: 'medical-outline', screen: 'Pharmacy', color: COLORS.pharmacy },
  { id: 5, label: 'Prescriptions', icon: 'document-text-outline', screen: 'MyPrescriptions', color: COLORS.primary },
  { id: 6, label: 'Reorder Medicine', icon: 'reload-outline', action: 'reorder_medicine', color: COLORS.pharmacy },
  { id: 7, label: 'Hospital Locator', icon: 'location-outline', action: 'hospital_locator', color: COLORS.info },
  { id: 8, label: 'Chat Support', icon: 'chatbubbles-outline', action: 'chat_support', color: COLORS.accent },
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

  const quickActions = QUICK_ACTIONS.map((action) => {
    if (action.screen === 'Bookings') return { ...action, badge: bookingCount };
    if (action.action === 'reorder_medicine') return { ...action, badge: orderCount };
    return action;
  });

  const handleQuickActionPress = async (action) => {
    if (action.action === 'online_now') {
      navigation.navigate('Doctors', { onlineOnly: true });
      return;
    }
    if (action.action === 'urgent_request') {
      navigation.navigate('PostRequest', { urgency: 'high' });
      return;
    }
    if (action.action === 'hospital_locator') {
      navigation.navigate('Pharmacy');
      return;
    }
    if (action.action === 'reorder_medicine') {
      navigation.navigate('MyOrders', { suggestReorder: true });
      return;
    }
    if (action.action === 'chat_support') {
      try {
        const { data } = await chatAPI.getRooms();
        const rooms = Array.isArray(data) ? data : data?.results || [];
        const supportRoom = rooms.find((room) =>
          (room.participants_detail || []).some((participant) => participant.id !== user?.id && ['admin', 'support'].includes(String(participant.role || '').toLowerCase()))
        );

        if (supportRoom) {
          const participants = supportRoom.participants_detail || [];
          const supportAgent = participants.find((participant) => participant.id !== user?.id) || {};
          navigation.navigate('ChatRoom', {
            roomId: supportRoom.id,
            recipient: {
              name: supportAgent.name || 'Customer Support',
              userId: supportAgent.id,
              role: supportAgent.role,
            },
          });
          return;
        }
      } catch (error) {
        // Fallback below
      }

      navigation.navigate('ChatList');
      return;
    }
    if (action.screen === 'PostRequest') {
      navigation.navigate('PostRequest', { urgency: 'high' });
      return;
    }
    navigation.navigate(action.screen);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentWrap}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
        </View>
        <View style={styles.headerActions}>
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

      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>How are you feeling?</Text>
            <Text style={styles.heroSubtitle}>Book a consultation with top doctors anytime</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Doctors')} style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Find a Doctor</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroIconWrap}>
            <Ionicons name="medkit-outline" size={28} color={COLORS.accent} />
          </View>
        </View>
      </Card>

      <Card style={styles.infoCard}>
        <View style={styles.infoHeaderRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Care Reminder</Text>
            <Text style={styles.infoSubtitle}>Use Online Now, Urgent Request, Reorder Medicine, or Chat Support based on your need.</Text>
          </View>
        </View>

        <View style={styles.infoTagsRow}>
          <View style={styles.infoTag}>
            <Ionicons name="radio-outline" size={12} color={COLORS.success} />
            <Text style={styles.infoTagText}>Online now</Text>
          </View>
          <View style={styles.infoTag}>
            <Ionicons name="flash-outline" size={12} color={COLORS.danger} />
            <Text style={styles.infoTagText}>Urgent care</Text>
          </View>
          <View style={styles.infoTag}>
            <Ionicons name="reload-outline" size={12} color={COLORS.pharmacy} />
            <Text style={styles.infoTagText}>Reorder meds</Text>
          </View>
        </View>
      </Card>

      <SectionHeader
        title="Specialties"
        actionText="View All"
        onAction={() => navigation.navigate('Doctors')}
        style={styles.sectionHeaderCompact}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specialtyRow}>
        {SPECIALTIES.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.specialtyCard, s.onlineOnly && styles.specialtyOnlineCard]}
            onPress={() =>
              s.onlineOnly
                ? navigation.navigate('Doctors', { onlineOnly: true })
                : navigation.navigate('Doctors', { specialty: s.name })
            }
          >
            <Ionicons name={s.icon} size={16} color={s.onlineOnly ? COLORS.success : COLORS.primary} />
            <Text style={[styles.specialtyText, s.onlineOnly && styles.specialtyOnlineText]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.quickActionsWrap}>
        <Text style={styles.quickActionPanelTitle}>Quick Actions</Text>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionItem}
              onPress={() => handleQuickActionPress(action)}
              activeOpacity={0.75}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '14' }]}> 
                <Ionicons name={action.icon} size={17} color={action.color} />
                {Number(action.badge) > 0 && (
                  <View style={styles.quickActionBadge}>
                    <Text style={styles.quickActionBadgeText}>{action.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.quickActionLabel} numberOfLines={2}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionHeader
        title="Upcoming Appointments"
        actionText="See All"
        onAction={() => navigation.navigate('Bookings')}
        style={styles.sectionHeaderCompact}
      />
      <View style={styles.appointmentListWrap}>
        {!dynamicUpcoming.length ? (
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No upcoming appointments</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
              Book a consultation to see it here.
            </Text>
          </Card>
        ) : dynamicUpcoming.map((apt) => (
          <TouchableOpacity
            key={apt.id}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('BookingDetail', { booking: apt })}
          >
            <Card style={styles.appointmentCard}>
              <View style={styles.appointmentRow}>
                <Avatar name={apt.doctor} size={40} color={COLORS.doctor} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={{ ...FONTS.bodyBold, color: COLORS.text }} numberOfLines={1}>{apt.doctor}</Text>
                  <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }} numberOfLines={1}>{apt.specialty}</Text>
                  <Text style={{ ...FONTS.small, color: COLORS.primary, marginTop: 2 }} numberOfLines={1}>{apt.date}</Text>
                </View>
                <Badge
                  text={apt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                  color={apt.status === 'confirmed' ? COLORS.success : COLORS.warning}
                  size="sm"
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  contentWrap: { paddingBottom: SPACING.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 34,
    paddingBottom: 10,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  greeting: { ...FONTS.body, color: COLORS.textSecondary },
  userName: { ...FONTS.h2, color: COLORS.text },
  notifBtn: { position: 'relative', padding: 8 },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1,
    borderColor: COLORS.bg,
  },

  stateWrap: {
    marginHorizontal: SPACING.xl,
    marginBottom: 10,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    alignItems: 'center',
  },
  stateText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 6 },

  heroCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { ...FONTS.h3, color: COLORS.text },
  heroSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  heroBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  heroBtnText: { ...FONTS.captionBold, color: COLORS.textInverse },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent + '14',
    marginLeft: 10,
  },

  infoCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.success + '33',
    backgroundColor: COLORS.success + '10',
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success + '18',
    marginRight: 8,
  },
  infoTitle: {
    ...FONTS.captionBold,
    color: COLORS.text,
  },
  infoSubtitle: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  infoTagsRow: {
    flexDirection: 'row',
    marginTop: 8,
    columnGap: 8,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    columnGap: 4,
  },
  infoTagText: {
    ...FONTS.small,
    color: COLORS.text,
    fontSize: 10,
  },

  sectionHeaderCompact: { marginBottom: 8 },
  specialtyRow: { paddingHorizontal: SPACING.xl, paddingBottom: 4 },
  specialtyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginRight: 8,
    minWidth: 82,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  specialtyOnlineCard: {
    borderColor: COLORS.success + '44',
    backgroundColor: COLORS.success + '10',
  },
  specialtyText: { ...FONTS.captionBold, color: COLORS.text, marginTop: 4 },
  specialtyOnlineText: { color: COLORS.success },
  quickActionsWrap: {
    marginHorizontal: SPACING.xl,
    marginTop: 2,
    marginBottom: 8,
  },
  quickActionPanelTitle: {
    ...FONTS.bodyBold,
    color: COLORS.text,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  quickActionItem: {
    width: '33.333%',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  quickActionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -5,
    backgroundColor: COLORS.danger,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.bg,
  },
  quickActionBadgeText: {
    ...FONTS.small,
    color: COLORS.text,
    fontSize: 9,
    lineHeight: 10,
  },
  quickActionLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    minHeight: 24,
    lineHeight: 13,
  },

  appointmentListWrap: { paddingHorizontal: SPACING.xl },
  appointmentCard: { marginBottom: 8 },
  appointmentRow: { flexDirection: 'row', alignItems: 'center' },
});
