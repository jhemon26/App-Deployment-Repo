import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
import { bookingAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

const statusColor = {
  confirmed: COLORS.success,
  pending: COLORS.warning,
  completed: COLORS.info,
  cancelled: COLORS.danger,
};

const typeIcon = {
  video: 'videocam-outline',
  chat: 'chatbubble-outline',
};

const normalizeStatus = (value) => String(value || '').toLowerCase().trim();

const getHoursUntilBooking = (booking) => {
  try {
    const datePart = String(booking.date || '').slice(0, 10);
    const timePart = String(booking.time_slot || booking.time || '').slice(0, 5);
    if (!datePart || !timePart) return Number.POSITIVE_INFINITY;

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const bookingDateTime = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
    return (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};


export default function MyBookingsScreen({ navigation }) {
  const [tab, setTab] = useState('All');
  const { dashboard, loading, error, refresh } = useRoleDashboard('general');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const liveBookings = (dashboard?.bookings || []).map((booking) => ({
      id: booking.id,
      doctor: booking.doctor?.name || 'Assigned Doctor',
      specialty: booking.doctor?.doctor_profile?.specialty || 'Consultation',
      date: booking.date,
      time: booking.time_slot || 'TBD',
      status: booking.status,
      type: booking.consultation_type || 'video',
      fee: booking.total_amount || booking.fee || 0,
    }));
    setBookings(liveBookings);
  }, [dashboard]);

  const filtered = useMemo(() => bookings.filter((b) => {
    const status = normalizeStatus(b.status);
    if (tab === 'All') return true;
    if (tab === 'Upcoming') return ['confirmed', 'pending'].includes(status);
    return status === tab.toLowerCase();
  }), [bookings, tab]);

  const handleCancel = async (booking) => {
    const hoursUntil = getHoursUntilBooking(booking);
    if (hoursUntil <= 6) {
      Toast.show({
        type: 'error',
        text1: 'Too late to cancel',
        text2: 'Bookings cannot be cancelled within 6 hours of the consultation.',
      });
      return;
    }

    setBookings((current) => current.filter((item) => item.id !== booking.id));
    try {
      await bookingAPI.cancel(booking.id);
      Toast.show({ type: 'info', text1: 'Booking cancelled', text2: 'Your consultation was cancelled successfully.' });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Cancel failed', text2: 'The booking was updated locally. Please sync later.' });
    }
  };

  const handleReschedule = (booking) => {
    Toast.show({ type: 'info', text1: 'Reschedule requested', text2: `${booking.doctor} can be rebooked from the booking flow.` });
  };

  const renderBookingCard = ({ item }) => {
    const sColor = statusColor[item.status] || COLORS.textMuted;
    const icon = typeIcon[item.type] || 'videocam-outline';
    const isUpcoming = ['confirmed', 'pending'].includes(item.status);

    return (
      <View style={[styles.card, { borderLeftColor: sColor }, SHADOWS.sm]}>
        <View style={styles.primaryRow}>
          <View style={[styles.typeIcon, { backgroundColor: sColor + '15' }]}>
            <Ionicons name={icon} size={15} color={sColor} />
          </View>

          <Avatar name={item.doctor} size={40} color={COLORS.doctor} style={styles.avatar} />

          <View style={styles.infoCol}>
            <Text style={styles.title} numberOfLines={1}>{item.doctor}</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{item.specialty}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="calendar-outline" size={11} color={COLORS.primary} />
              <Text style={styles.timeText} numberOfLines={1}>{item.date} at {item.time}</Text>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Badge text={item.status} color={sColor} size="sm" />
            <Text style={styles.fee}>฿{item.fee}</Text>
          </View>
        </View>

        <View style={styles.actionArea}>
          {item.status === 'confirmed' && (
            <View style={styles.actionRowThree}>
              <Button
                title="Join"
                size="sm"
                onPress={() => navigation.navigate('VideoCall', { doctor: { name: item.doctor } })}
                style={{ flex: 1.05 }}
              />
              <Button
                title="Message"
                size="sm"
                variant="outline"
                color={COLORS.primary}
                onPress={() => navigation.navigate('ChatRoom', { recipient: { name: item.doctor } })}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                size="sm"
                variant="outline"
                color={COLORS.danger}
                onPress={() => handleCancel(item)}
                style={{ flex: 1 }}
              />
            </View>
          )}

          {item.status === 'pending' && (
            <View style={styles.actionRowTwo}>
              <Button
                title="Reschedule"
                size="sm"
                variant="outline"
                color={COLORS.info}
                onPress={() => handleReschedule(item)}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                size="sm"
                variant="outline"
                color={COLORS.danger}
                onPress={() => handleCancel(item)}
                style={{ flex: 1 }}
              />
            </View>
          )}

          <View style={isUpcoming ? styles.secondaryActionSpacing : null}>
            <Button
              title="View Details"
              size="sm"
              variant="outline"
              color={COLORS.primary}
              onPress={() => navigation.navigate('BookingDetail', { booking: item })}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>My Bookings</Text>
        <Text style={styles.pageSubtitle}>{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</Text>

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
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <TouchableOpacity style={styles.retryBox} onPress={refresh}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
              <Text style={styles.retryText}>Could not load bookings. Tap to retry.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No bookings yet</Text>
              <Text style={styles.emptyText}>Your consultations will appear here once you book with a doctor.</Text>
            </View>
          )
        }
        renderItem={renderBookingCard}
      />
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  pageTitle: { ...FONTS.h2, color: COLORS.text },
  pageSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },

  tabBar: { paddingTop: 10, paddingBottom: 2 },
  tabChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { ...FONTS.captionBold, color: COLORS.textSecondary, fontSize: 12 },
  tabTextActive: { ...FONTS.captionBold, color: COLORS.textInverse, fontSize: 12 },

  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 90 },
  loadingBox: { paddingTop: SPACING.xxxl, alignItems: 'center' },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    padding: 11,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { marginLeft: 8 },
  infoCol: { flex: 1, marginLeft: 8, minWidth: 0 },
  title: { ...FONTS.bodyBold, color: COLORS.text },
  subtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  timeText: { ...FONTS.small, color: COLORS.primary, marginLeft: 4 },

  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  fee: { ...FONTS.captionBold, color: COLORS.text, marginTop: 5 },

  actionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 10,
    paddingTop: 9,
  },
  actionRowThree: { flexDirection: 'row', columnGap: 8 },
  actionRowTwo: { flexDirection: 'row', columnGap: 8 },
  secondaryActionSpacing: { marginTop: 8 },

  retryBox: {
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    padding: SPACING.md,
    alignItems: 'center',
  },
  retryText: { ...FONTS.caption, color: COLORS.textSecondary },
  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
