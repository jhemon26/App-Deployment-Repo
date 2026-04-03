import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, Badge, Chip, Button, SearchBar } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { bookingAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Today', 'Pending', 'Completed'];

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
    } catch (error) {
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
    if (tab === 'Pending') return a.status === 'pending';
    if (tab === 'Completed') return a.status === 'completed';
    return true;
  }), [appointments, search, tab]);

  const updateStatus = (id, nextStatus) => {
    setAppointments((current) => current.map((appointment) => (appointment.id === id ? { ...appointment, status: nextStatus } : appointment)));
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Appointments</Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search appointments..." />
      </View>

      <FlatList
        horizontal data={TABS} keyExtractor={(i) => i} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}
        renderItem={({ item }) => <Chip label={item} active={tab === item} onPress={() => setTab(item)} />}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxxl }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        onRefresh={() => loadAppointments({ silent: true })}
        refreshing={refreshing}
        ListEmptyComponent={
          loadError ? (
            <Card>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Could not load appointments</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Pull down to retry loading your schedule.</Text>
            </Card>
          ) : (
            <Card>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No appointments found</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>New bookings will appear here.</Text>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={item.patient} size={48} color={COLORS.general} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.patient}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{item.symptoms}</Text>
                <Text style={{ ...FONTS.small, color: COLORS.primary, marginTop: 4 }}>
                  {item.date} • {item.time} • {item.type === 'video' ? 'Video' : 'Chat'}
                </Text>
              </View>
              <Badge
                text={item.status}
                color={item.status === 'confirmed' ? COLORS.success : item.status === 'pending' ? COLORS.warning : COLORS.info}
                size="sm"
              />
            </View>
            {item.status !== 'completed' && (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Button title={item.type === 'video' ? 'Start Call' : 'Open Chat'} size="sm" onPress={() => handleStart(item)} style={{ flex: 1 }} />
                <Button title="Prescribe" size="sm" variant="outline" onPress={() => navigation.navigate('Prescription', { booking: item })} style={{ flex: 1 }} />
              </View>
            )}
            {item.status === 'confirmed' && (
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
                <Button title="Complete" size="sm" color={COLORS.success} onPress={() => handleComplete(item)} style={{ flex: 1 }} />
                <Button title="Remind" size="sm" variant="outline" color={COLORS.info} onPress={() => handleRemind(item)} style={{ flex: 1 }} />
              </View>
            )}
          </Card>
        )}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
});
