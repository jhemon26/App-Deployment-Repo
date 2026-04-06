import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, useWindowDimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, Avatar, Badge, SectionHeader } from '../../components/UIComponents';
import AccountQuickMenu from '../../components/AccountQuickMenu';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
import { bookingAPI, requestAPI } from '../../services/api';

const isCurrentlyInConsultation = (bookings, consultationDurationMins = 60) => {
  try {
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0];

    return bookings.some((booking) => {
      const bookingDate = String(booking.date || '').slice(0, 10);
      const bookingTime = booking.time_slot || booking.time || '';
      
      if (bookingDate !== todayKey || !bookingTime) return false;
      if (!['confirmed', 'in_progress'].includes(booking.status)) return false;

      const [hour, min] = bookingTime.split(':').map(Number);
      const bookingStart = new Date();
      bookingStart.setHours(hour, min, 0);
      const bookingEnd = new Date(bookingStart.getTime() + consultationDurationMins * 60 * 1000);

      return now >= bookingStart && now <= bookingEnd;
    });
  } catch {
    return false;
  }
};

export default function DoctorHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { dashboard, loading, error, refresh } = useRoleDashboard('doctor');
  const { width } = useWindowDimensions();
  const compact = width < 900;

  const [quickOnlineActive, setQuickOnlineActive] = useState(false);
  const [quickOnlineLoading, setQuickOnlineLoading] = useState(false);
  const [quickOnlineLocked, setQuickOnlineLocked] = useState(false);
  const [urgentRequestsCount, setUrgentRequestsCount] = useState(0);
  const [urgentRequestsLoading, setUrgentRequestsLoading] = useState(false);


  const loadUrgentRequests = useCallback(async () => {
    setUrgentRequestsLoading(true);
    try {
      const { data } = await requestAPI.list({});
      const rows = Array.isArray(data) ? data : data?.results || [];
      const urgent = rows.filter((request) => {
        const urgency = String(request.urgency || '').toLowerCase();
        const status = String(request.status || 'open').toLowerCase();
        return ['high', 'urgent'].includes(urgency) && !['resolved', 'cancelled', 'closed'].includes(status);
      });
      setUrgentRequestsCount(urgent.length);
    } catch (err) {
      console.error('Error loading requests:', err);
      setUrgentRequestsCount(0);
    } finally {
      setUrgentRequestsLoading(false);
    }
  }, []);

  const checkCurrentConsultation = useCallback(async () => {
    try {
      const { data } = await bookingAPI.list({});
      const bookings = Array.isArray(data) ? data : data?.results || [];
      const inConsultation = isCurrentlyInConsultation(bookings);
      setQuickOnlineLocked(inConsultation);
      return !inConsultation;
    } catch (err) {
      console.error('Error checking consultation:', err);
      setQuickOnlineLocked(false);
      return false;
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkCurrentConsultation();
      loadUrgentRequests();
    }, [checkCurrentConsultation, loadUrgentRequests])
  );

  const toggleQuickOnline = async () => {
    setQuickOnlineLoading(true);
    try {
      const canPost = await checkCurrentConsultation();
      if (!canPost) {
        Toast.show({ 
          type: 'error', 
          text1: 'You are in a consultation', 
          text2: 'Cannot go online while in an active consultation' 
        });
        setQuickOnlineLoading(false);
        return;
      }

      if (!quickOnlineActive) {
        setQuickOnlineActive(true);
        Toast.show({ type: 'success', text1: 'You are now online!' });
      } else {
        setQuickOnlineActive(false);
        Toast.show({ type: 'success', text1: 'You are now offline' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error updating status' });
      console.error(err);
    } finally {
      setQuickOnlineLoading(false);
    }
  };

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

  const todayAppointments = Number(dashboard?.today_appointments ?? 4);
  const totalPatients = Number(dashboard?.total_patients ?? 1247);
  const totalEarnings = Number(dashboard?.total_earnings ?? 45000);
  const rating = Number(dashboard?.rating ?? 4.9);
  const totalReviews = Number(dashboard?.total_reviews ?? dashboard?.reviews_count ?? dashboard?.review_count ?? 0);
  const completedAppointments = Number(
    dashboard?.completed_appointments ??
    (dashboard?.appointments || []).filter((apt) => String(apt?.status || '').toLowerCase() === 'completed').length ??
    0
  );
  const pendingReviews = Math.max(completedAppointments - totalReviews, 0);

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


      <Card style={styles.quickOnlineCard}>
        <View style={styles.quickOnlineHeader}>
          <View style={styles.quickOnlineCopy}>
            <View style={styles.quickOnlineTitleRow}>
              <View style={styles.quickDot} />
              <Text style={styles.quickOnlineTitle}>Online now</Text>
            </View>
            <Text style={styles.quickOnlineSubtitle}>
              {quickOnlineLocked ? 'Busy in consultation' : 'Tap to go online for new patients'}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleQuickOnline}
            disabled={quickOnlineLoading || quickOnlineLocked}
            style={[
              styles.quickOnlineToggle,
              quickOnlineActive && styles.quickOnlineToggleActive,
              (quickOnlineLoading || quickOnlineLocked) && styles.quickOnlineToggleDisabled,
            ]}
          >
            {quickOnlineLoading ? (
              <ActivityIndicator size="small" color={COLORS.textInverse} />
            ) : (
              <Ionicons
                name={quickOnlineActive ? 'radio' : 'radio-button-off-outline'}
                size={18}
                color={COLORS.textInverse}
              />
            )}
          </TouchableOpacity>
        </View>
        {quickOnlineActive && (
          <Text style={styles.quickOnlineFoot}>Patients can book you right now.</Text>
        )}
      </Card>

      <TouchableOpacity activeOpacity={0.85} style={styles.urgentCard} onPress={loadUrgentRequests}>
        <View style={styles.urgentTopRow}>
          <View style={styles.urgentIconWrap}>
            <Ionicons name="warning-outline" size={16} color={COLORS.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.urgentTitle}>Urgent requests</Text>
            <Text style={styles.urgentSubtitle}>
              {urgentRequestsLoading ? 'Checking patient requests...' : 'Patients seeking consultation now'}
            </Text>
          </View>
          <Text style={styles.urgentCount}>{urgentRequestsCount}</Text>
        </View>
      </TouchableOpacity>


      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Appointments')}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.quickActionText}>Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Patients')}>
          <Ionicons name="people-outline" size={16} color={COLORS.info} />
          <Text style={styles.quickActionText}>Patients</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('PostAvailability')}>
          <Ionicons name="time-outline" size={16} color={COLORS.accent} />
          <Text style={styles.quickActionText}>My Availability</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={16} color={COLORS.success} />
          <Text style={styles.quickActionText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionBtn} onPress={refresh}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.warning} />
          <Text style={styles.quickActionText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statsGrid, compact && styles.statsGridCompact]}>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={() => navigation.navigate('Appointments')}>
          <StatCard style={styles.statCard} label="Today" value={String(todayAppointments)} color={COLORS.primary} icon={<Ionicons name="calendar-outline" size={16} color={COLORS.primary} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={() => navigation.navigate('Patients')}>
          <StatCard style={styles.statCard} label="Patients" value={String(totalPatients)} color={COLORS.info} icon={<Ionicons name="people-outline" size={16} color={COLORS.info} />} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} style={styles.statCardTap} onPress={() => refresh()}>
          <StatCard style={styles.statCard} label="Earnings" value={`฿${Number(totalEarnings).toLocaleString()}`} color={COLORS.success} icon={<Ionicons name="cash-outline" size={16} color={COLORS.success} />} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.statCardTap}
          onPress={() => navigation.navigate('DoctorRatingInsights', {
            rating,
            totalPatients,
            totalReviews,
            completedAppointments,
            pendingReviews,
          })}
        >
          <StatCard style={styles.statCard} label="Rating" value={String(rating)} color={COLORS.warning} icon={<Ionicons name="star-outline" size={16} color={COLORS.warning} />} />
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: SPACING.xl },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.lg, paddingRight: SPACING.md },
  stateWrap: { paddingVertical: SPACING.xl, alignItems: 'center' },
  stateText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.sm },

  quickOnlineCard: {
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  quickOnlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickOnlineCopy: {
    flex: 1,
    paddingRight: 10,
  },
  quickOnlineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  quickDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: COLORS.success,
  },
  quickOnlineTitle: { ...FONTS.bodyBold, color: COLORS.text },
  quickOnlineSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  quickOnlineToggle: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: COLORS.textMuted + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickOnlineToggleActive: {
    backgroundColor: COLORS.success,
  },
  quickOnlineToggleDisabled: {
    backgroundColor: COLORS.textMuted + '20',
    opacity: 0.5,
  },
  quickOnlineFoot: {
    ...FONTS.caption,
    color: COLORS.success,
    marginTop: 8,
  },
  urgentCard: {
    marginBottom: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.danger + '08',
  },
  urgentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  urgentIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: COLORS.danger + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentTitle: { ...FONTS.bodyBold, color: COLORS.text },
  urgentSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  urgentCount: { ...FONTS.h3, color: COLORS.danger },
  quickOnlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.success + '30',
  },
  quickOnlineStatusText: { ...FONTS.small, color: COLORS.success, marginLeft: 8 },

  quickActions: { flexDirection: 'row', paddingVertical: SPACING.lg, columnGap: SPACING.md },
  quickActionBtn: { flex: 1, height: 60, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', columnGap: 4 },
  quickActionText: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },

  statsGrid: { flexDirection: 'row', columnGap: SPACING.md, marginBottom: SPACING.lg },
  statsGridCompact: { flexWrap: 'wrap', rowGap: SPACING.md },
  statCardTap: { flex: 1 },
  statCard: { flex: 1 },

  timeCol: { width: 32, alignItems: 'center' },
  joinBtn: { marginTop: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.success, alignItems: 'center' },
});
