import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button, SearchBar } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { bookingAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Today', 'Pending', 'Completed'];

const statusColor = {
  confirmed: COLORS.success,
  pending: COLORS.warning,
  completed: COLORS.info,
  cancelled: COLORS.danger,
};

const normalizeStatus = (value) => String(value || '').toLowerCase().trim();

export default function DoctorAppointmentsScreen({ navigation }) {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadAppointments = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setLoadError(false);
    try {
      const { data } = await bookingAPI.list();
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((booking) => ({
        id: booking.id,
        patient: booking.patient_detail?.name || booking.patient_name || 'Patient',
        date: booking.date,
        time: booking.time_slot || 'TBD',
        status: booking.status,
        type: booking.consultation_type || 'video',
        symptoms: booking.symptoms || 'No symptoms provided',
      }));
      setAppointments(mapped);
    } catch (err) {
      setAppointments([]);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filtered = useMemo(() => appointments.filter((a) => {
    const matchesSearch = [a.patient, a.symptoms, a.type, a.status]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (tab === 'Today') return a.date === today;
    const status = normalizeStatus(a.status);
    if (tab === 'Pending') return status === 'pending';
    if (tab === 'Completed') return status === 'completed';
    return true;
  }), [appointments, search, tab, today]);

  const updateStatus = (id, nextStatus) => {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status: nextStatus } : appointment
      )
    );
  };

  const handleStart = (item) => {
    bookingAPI.confirm(item.id)
      .then(() => {
        updateStatus(item.id, 'confirmed');
        Toast.show({ type: 'info', text1: 'Consultation started', text2: `${item.patient} is ready for the session.` });
      })
      .catch(() => {
        Toast.show({ type: 'info', text1: 'Open consultation', text2: `${item.patient} is ready for the session.` });
      });
    navigation.navigate('VideoCall', { patient: { name: item.patient } });
  };

  const handleComplete = (item) => {
    updateStatus(item.id, 'completed');
    Toast.show({ type: 'success', text1: 'Marked completed', text2: `${item.patient}'s appointment was completed.` });
  };

  const handleRemind = (item) => {
    Toast.show({ type: 'info', text1: 'Reminder sent', text2: `A reminder was sent to ${item.patient}.` });
  };

  const renderAppointmentCard = ({ item }) => {
    const sColor = statusColor[item.status] || COLORS.textMuted;
    const isActionable = item.status !== 'completed' && item.status !== 'cancelled';
    const typeIconName = item.type === 'video' ? 'videocam-outline' : 'chatbubble-outline';

    return (
      <View style={[styles.card, { borderLeftColor: sColor }, SHADOWS.sm]}>
        <View style={styles.primaryRow}>
          <Avatar name={item.patient} size={36} color={COLORS.general} />

          <View style={styles.infoCol}>
            <Text style={styles.name}>{item.patient}</Text>
            <Text style={styles.symptoms} numberOfLines={2}>{item.symptoms}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={11} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.date} • {item.time}</Text>
              </View>
              <View style={[styles.metaChip, { backgroundColor: COLORS.primary + '15' }]}> 
                <Ionicons name={typeIconName} size={11} color={COLORS.primary} />
                <Text style={styles.metaText}>{item.type === 'video' ? 'Video' : 'Chat'}</Text>
              </View>
            </View>
          </View>

          <Badge text={item.status} color={sColor} size="sm" />
        </View>

        {isActionable && (
          <View style={styles.actionArea}>
            <View style={styles.actionRow}>
              <Button
                title={item.type === 'video' ? 'Start Call' : 'Open Chat'}
                size="sm"
                onPress={() => handleStart(item)}
                style={{ flex: 1 }}
              />
              <Button
                title="Prescribe"
                size="sm"
                variant="outline"
                onPress={() => navigation.navigate('Prescription', { booking: item })}
                style={{ flex: 1 }}
              />
            </View>

            {item.status === 'confirmed' && (
              <View style={[styles.actionRow, { marginTop: 8 }]}> 
                <Button
                  title="Complete"
                  size="sm"
                  color={COLORS.success}
                  onPress={() => handleComplete(item)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Remind"
                  size="sm"
                  variant="outline"
                  color={COLORS.info}
                  onPress={() => handleRemind(item)}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>
        )}

        {item.status === 'completed' && (
          <View style={styles.actionArea}>
            <View style={styles.completedNote}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.info} />
              <Text style={styles.completedText}>Consultation completed</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Appointments</Text>
        <Text style={styles.pageSubtitle}>{filtered.length} shown</Text>

        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search appointments..." />
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
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => loadAppointments({ silent: true })}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loadError ? (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.danger + '20' }]}> 
                  <Ionicons name="alert-circle-outline" size={28} color={COLORS.danger} />
                </View>
                <Text style={styles.emptyTitle}>Could not load appointments</Text>
                <Text style={styles.emptyText}>Pull down to retry loading your schedule.</Text>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.primary + '20' }]}> 
                  <Ionicons name="calendar-outline" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.emptyTitle}>No appointments found</Text>
                <Text style={styles.emptyText}>New bookings will appear here.</Text>
              </View>
            )
          }
          renderItem={renderAppointmentCard}
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  pageTitle: { ...FONTS.h2, color: COLORS.text },
  pageSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  searchWrap: { marginTop: 10 },

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
  tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabChipText: { ...FONTS.captionBold, color: COLORS.textSecondary },
  tabChipTextActive: { color: COLORS.textInverse },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxl },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 84 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoCol: { flex: 1, marginLeft: 8, marginRight: 6 },
  name: { ...FONTS.bodyBold, color: COLORS.text },
  symptoms: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 1 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, rowGap: 5, columnGap: 5 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaText: { ...FONTS.small, color: COLORS.primary, marginLeft: 4, fontSize: 10 },

  actionArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 7, marginTop: 7 },
  actionRow: { flexDirection: 'row', columnGap: SPACING.sm },

  completedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '15',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.info + '30',
  },
  completedText: { ...FONTS.caption, color: COLORS.textSecondary, marginLeft: SPACING.sm },

  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
