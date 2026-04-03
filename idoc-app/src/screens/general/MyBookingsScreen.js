import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, Badge, Chip, EmptyState, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
import { bookingAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Upcoming', 'Completed', 'Cancelled'];

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
    if (tab === 'All') return true;
    if (tab === 'Upcoming') return ['confirmed', 'pending'].includes(b.status);
    return b.status === tab.toLowerCase();
  }), [bookings, tab]);

  const statusColor = { confirmed: COLORS.success, pending: COLORS.warning, completed: COLORS.info, cancelled: COLORS.danger };

  const handleCancel = async (booking) => {
    setBookings((current) => current.filter((item) => item.id !== booking.id));
    try {
      await bookingAPI.cancel(booking.id);
      Toast.show({ type: 'info', text1: 'Booking cancelled', text2: 'Your consultation was cancelled successfully.' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Cancel failed', text2: 'The booking was updated locally. Please sync later.' });
    }
  };

  const handleReschedule = (booking) => {
    Toast.show({ type: 'info', text1: 'Reschedule requested', text2: `${booking.doctor} can be rebooked from the booking flow.` });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>My Bookings</Text>
      </View>

      <FlatList
        horizontal
        data={TABS}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}
        renderItem={({ item }) => <Chip label={item} active={tab === item} onPress={() => setTab(item)} />}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: SPACING.xxxl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <TouchableOpacity style={styles.retryBox} onPress={refresh}>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Could not load bookings. Tap to retry.</Text>
            </TouchableOpacity>
          ) : (
            <EmptyState title="No bookings" message="You don't have any bookings yet" icon={<Ionicons name="calendar-outline" size={46} color={COLORS.textMuted} />} />
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={item.doctor} size={50} color={COLORS.doctor} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.doctor}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{item.specialty}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.primary, marginTop: 2 }}>
                  {item.date} at {item.time} • {item.type === 'video' ? 'Video' : 'Chat'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge text={item.status} color={statusColor[item.status]} size="sm" />
                <Text style={{ ...FONTS.captionBold, color: COLORS.text, marginTop: 6 }}>฿{item.fee}</Text>
              </View>
            </View>
            {item.status === 'confirmed' && (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Button title="Join Call" size="sm" onPress={() => navigation.navigate('VideoCall', { doctor: { name: item.doctor } })} style={{ flex: 1 }} />
                <Button title="Cancel" size="sm" variant="outline" color={COLORS.danger} onPress={() => handleCancel(item)} style={{ flex: 1 }} />
              </View>
            )}
            {item.status === 'pending' && (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Button title="Reschedule" size="sm" variant="outline" color={COLORS.info} onPress={() => handleReschedule(item)} style={{ flex: 1 }} />
                <Button title="Cancel" size="sm" variant="outline" color={COLORS.danger} onPress={() => handleCancel(item)} style={{ flex: 1 }} />
              </View>
            )}
            <View style={{ marginTop: SPACING.sm }}>
              <Button title="View Details" size="sm" variant="outline" color={COLORS.primary} onPress={() => navigation.navigate('BookingDetail', { booking: item })} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
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
