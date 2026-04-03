import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, Avatar, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';

export default function DoctorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('doctor');

  const appointments = (dashboard?.appointments || dashboard?.today_schedule || [])
    .slice(0, 6)
    .map((apt) => ({
      id: apt.id,
      patient: apt.patient?.name || apt.patient_name || apt.patient_detail?.name || apt.patient || 'Patient',
      time: apt.time || apt.time_slot || apt.slot || 'TBD',
      type: apt.type || apt.consultation_type || 'video',
      status: apt.status || 'upcoming',
      symptoms: apt.symptoms || apt.reason || apt.notes || 'Consultation',
    }));

  const todayAppointments = dashboard?.today_appointments ?? 4;
  const totalPatients = dashboard?.total_patients ?? 1247;
  const totalEarnings = dashboard?.total_earnings ?? 45000;
  const rating = dashboard?.rating ?? 4.9;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={{ ...FONTS.body, color: COLORS.textSecondary }}>Good morning,</Text>
          <Text style={{ ...FONTS.h2, color: COLORS.text }}>{user?.name || 'Doctor'}</Text>
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
          <Text style={styles.stateText}>Loading schedule...</Text>
        </View>
      )}
      {!!error && !loading && (
        <TouchableOpacity style={styles.stateWrap} onPress={refresh}>
          <Text style={styles.stateText}>Could not load latest dashboard. Tap to retry.</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard label="Today" value={String(todayAppointments)} color={COLORS.primary} icon={<Ionicons name="calendar-outline" size={16} color={COLORS.primary} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Patients" value={String(totalPatients)} color={COLORS.info} icon={<Ionicons name="people-outline" size={16} color={COLORS.info} />} />
      </View>
      <View style={[styles.statsRow, { marginTop: SPACING.md }]}>
        <StatCard label="Earnings" value={`฿${Number(totalEarnings).toLocaleString()}`} color={COLORS.success} icon={<Ionicons name="cash-outline" size={16} color={COLORS.success} />} />
        <View style={{ width: SPACING.md }} />
        <StatCard label="Rating" value={String(rating)} color={COLORS.warning} icon={<Ionicons name="star-outline" size={16} color={COLORS.warning} />} />
      </View>

      {/* Today's Schedule */}
      <SectionHeader title="Today's Schedule" actionText="View All" onAction={() => navigation.navigate('Appointments')} style={{ marginTop: SPACING.xl }} />
      <View style={{ paddingHorizontal: SPACING.xl }}>
        {!appointments.length ? (
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No consultations scheduled</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>New bookings will appear here automatically.</Text>
          </Card>
        ) : appointments.map((apt) => (
          <Card key={apt.id} style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.timeCol}>
                <Text style={{ ...FONTS.captionBold, color: COLORS.primary }}>{apt.time}</Text>
                <Ionicons name={apt.type === 'video' ? 'videocam-outline' : 'chatbubble-outline'} size={16} color={COLORS.textSecondary} style={{ marginTop: 4 }} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.lg }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{apt.patient}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{apt.symptoms}</Text>
              </View>
              <Badge
                text={apt.status === 'in_progress' ? 'Live' : 'Upcoming'}
                color={apt.status === 'in_progress' ? COLORS.success : COLORS.info}
                size="sm"
              />
            </View>
            {apt.status === 'in_progress' && (
              <TouchableOpacity
                style={styles.joinBtn}
                onPress={() => navigation.navigate('VideoCall', { patient: { name: apt.patient } })}
              >
                <Text style={{ ...FONTS.captionBold, color: COLORS.textInverse }}>Join Consultation</Text>
              </TouchableOpacity>
            )}
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
  timeCol: {
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minWidth: 65,
  },
  joinBtn: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});
