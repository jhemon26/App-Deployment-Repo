import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, SearchBar, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { doctorAPI, bookingAPI } from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

const isTimeWithinRange = (startTime, endTime) => {
  try {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMin}`;
    return currentTime >= startTime && currentTime <= endTime;
  } catch {
    return false;
  }
};

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

export default function DoctorListScreen({ navigation, route }) {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(route?.params?.specialty || 'All');
  const [onlineOnly, setOnlineOnly] = useState(Boolean(route?.params?.onlineOnly));
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDoctors = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedSpecialty !== 'All') params.specialty = selectedSpecialty;
      if (search.trim()) params.search = search.trim();

      const { data } = await doctorAPI.list(params);
      const rows = Array.isArray(data) ? data : data?.results || [];

      // Load today's bookings
      let allBookings = [];
      try {
        const { data: bookingData } = await bookingAPI.list({});
        allBookings = Array.isArray(bookingData) ? bookingData : bookingData?.results || [];
      } catch {
        allBookings = [];
      }

      const todayName = getDayName();

      const mapped = rows.map((entry) => {
        const profile = entry.user ? entry : entry.doctor_profile || entry;
        const user = profile.user || {};

        // Get doctor's bookings today
        const doctorBookings = allBookings.filter(
          (b) =>
            b.doctor === user.id ||
            b.doctor_id === user.id ||
            b.doctor?.id === user.id ||
            b.doctor_detail?.id === user.id ||
            b.doctor_profile_id === profile.id
        );

        // Check if doctor is currently in a consultation
        const currentlyInConsultation = isCurrentlyInConsultation(doctorBookings);

        // Check weekly schedule for today
        const availabilityHours = profile.availability_hours || {};
        const todaySchedule = availabilityHours[todayName];
        const hasWeeklyScheduleToday = todaySchedule && todaySchedule.enabled;

        // Check if within today's weekly availability hours
        const withinWeeklyHours = hasWeeklyScheduleToday &&
          todaySchedule.start &&
          todaySchedule.end &&
          isTimeWithinRange(todaySchedule.start, todaySchedule.end);

        // Check if doctor posted quick online now
        const isQuickOnlineActive = profile.is_quick_online_now === true;

        // Online: not in consultation AND (quick online OR within weekly hours)
        const isOnlineNow = !currentlyInConsultation && (isQuickOnlineActive || withinWeeklyHours);

        // Can book if online now OR has weekly schedule for today
        const canBook = isOnlineNow || hasWeeklyScheduleToday;

        // Get consultation type for today
        const consultationType = todaySchedule?.type || 'both';

        // Availability display info
        let availabilityInfo = null;
        if (isQuickOnlineActive) {
          availabilityInfo = { source: 'quick', text: 'Online now' };
        } else if (hasWeeklyScheduleToday) {
          availabilityInfo = {
            source: 'weekly',
            text: `${todaySchedule.start}-${todaySchedule.end}`,
          };
        }

        return {
          id: profile.id || String(Math.random()),
          doctorProfileId: profile.id,
          userId: user.id,
          name: user.name || profile.name || 'Doctor',
          specialty: profile.specialty || 'General Medicine',
          rating: Number(profile.rating || 0),
          fee: Number(profile.fee || 0),
          available: profile.is_available !== false,
          isOnlineNow,
          currentlyInConsultation,
          isQuickOnlineActive,
          hasWeeklyScheduleToday,
          weeklyHours: hasWeeklyScheduleToday ? `${todaySchedule.start}-${todaySchedule.end}` : null,
          withinWeeklyHours,
          consultationType,
          availabilityInfo,
          canBook,
          bookings: doctorBookings,
          experience: profile.experience || 'Experience not listed',
          patients: Number(profile.total_patients || 0),
          bio: profile.bio,
        };
      });

      setDoctors(mapped);
    } catch (err) {
      setDoctors([]);
      setError(err);
      console.error('Error loading doctors:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpecialty]);

  useFocusEffect(
    React.useCallback(() => {
      if (route?.params?.specialty) {
        setSelectedSpecialty(route.params.specialty);
      }
      if (typeof route?.params?.onlineOnly === 'boolean') {
        setOnlineOnly(route.params.onlineOnly);
      }
      loadDoctors();
    }, [loadDoctors, route?.params?.specialty, route?.params?.onlineOnly])
  );

  const filtered = useMemo(() => {
    const base = doctors.filter((d) => {
      const normalizedSearch = search.toLowerCase();
      const matchSearch = d.name.toLowerCase().includes(normalizedSearch) ||
        d.specialty.toLowerCase().includes(normalizedSearch);
      const matchSpecialty = selectedSpecialty === 'All' || d.specialty === selectedSpecialty;
      const matchOnline = !onlineOnly || d.isOnlineNow;
      return matchSearch && matchSpecialty && matchOnline;
    });

    return [...base].sort((a, b) => Number(b.isOnlineNow) - Number(a.isOnlineNow));
  }, [doctors, search, selectedSpecialty, onlineOnly]);

  const specialties = useMemo(() => {
    const dynamic = [...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
    return dynamic.length ? ['All', ...dynamic] : ['All'];
  }, [doctors]);

  const onlineNowCount = useMemo(
    () => doctors.filter((d) => d.isOnlineNow).length,
    [doctors]
  );

  const getConsultationIcon = (type) => {
    switch (type) {
      case 'video':
        return 'videocam-outline';
      case 'chat':
        return 'chatbubble-outline';
      case 'both':
      default:
        return 'swap-horizontal-outline';
    }
  };

  const renderDoctor = ({ item }) => (
    <Card style={styles.doctorCard}>
      <View style={styles.primaryRow}>
        <Avatar name={item.name} size={34} color={COLORS.doctor} />

        <View style={styles.infoCol}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.specialty} numberOfLines={1}>{item.specialty}</Text>
        </View>

        <View style={styles.priceCol}>
          {item.currentlyInConsultation ? (
            <View style={styles.inConsultationBadge}>
              <Ionicons name="call" size={8} color={COLORS.info} />
              <Text style={styles.inConsultationText}>In consultation</Text>
            </View>
          ) : item.isOnlineNow ? (
            <View style={styles.onlineBadge}>
              <Ionicons name="radio-outline" size={8} color={COLORS.success} />
              <Text style={styles.onlineBadgeText}>
                {item.isQuickOnlineActive ? 'Online now' : 'Online now'}
              </Text>
            </View>
          ) : item.hasWeeklyScheduleToday ? (
            <View style={styles.offlineBadge}>
              <Ionicons name="radio-button-off-outline" size={8} color={COLORS.textMuted} />
              <Text style={styles.offlineBadgeText}>{item.weeklyHours}</Text>
            </View>
          ) : (
            <View style={styles.noScheduleBadge}>
              <Text style={styles.noScheduleText}>No hours set</Text>
            </View>
          )}
          <Text style={styles.priceLabel}>Fee</Text>
          <Text style={styles.price}>฿{item.fee}</Text>
        </View>
      </View>

      <View style={styles.metaChipsRow}>
        <View style={styles.metaChip}>
          <Ionicons name="star" size={12} color={COLORS.warning} />
          <Text style={styles.metaChipText}>{item.rating || 'N/A'}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="briefcase-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaChipText}>{item.experience}</Text>
        </View>
        <View style={styles.metaChip}>
          <Ionicons name="people-outline" size={12} color={COLORS.textSecondary} />
          <Text style={styles.metaChipText}>{item.patients}+ patients</Text>
        </View>
        {item.canBook && (
          <View style={styles.metaChip}>
            <Ionicons name={getConsultationIcon(item.consultationType)} size={12} color={COLORS.primary} />
            <Text style={styles.metaChipText}>
              {item.consultationType === 'both' ? 'Chat & Video' : item.consultationType === 'video' ? 'Video' : 'Chat'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <Button
          title="View Profile"
          size="sm"
          variant="outline"
          onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
          style={{ flex: 1 }}
        />
        <Button
          title="Book Appointment"
          size="sm"
          onPress={() => navigation.navigate('Booking', { doctor: item })}
          disabled={!item.canBook}
          style={{ flex: 1.05 }}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Find a Doctor</Text>
        <Text style={styles.pageSubtitle}>{filtered.length} doctors shown · {onlineNowCount} online now</Text>

        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search doctors, specialties..." />
        </View>

        <View style={styles.onlineFilterRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setOnlineOnly((v) => !v)}
            style={[styles.onlineFilterChip, onlineOnly && styles.onlineFilterChipActive]}
          >
            <Ionicons name="radio-outline" size={14} color={onlineOnly ? COLORS.textInverse : COLORS.success} />
            <Text style={[styles.onlineFilterText, onlineOnly && styles.onlineFilterTextActive]}>Online Now</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {specialties.map((specialty) => {
            const active = selectedSpecialty === specialty;
            return (
              <TouchableOpacity
                key={specialty}
                activeOpacity={0.8}
                onPress={() => setSelectedSpecialty(specialty)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{specialty}</Text>
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
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDoctor}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyBox}>
                <Ionicons name="alert-circle-outline" size={36} color={COLORS.danger} />
                <Text style={styles.emptyTitle}>Could not load doctors</Text>
                <Text style={styles.emptyText}>Check your connection and try again.</Text>
                <Button title="Retry" onPress={loadDoctors} style={{ marginTop: SPACING.md }} />
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="search" size={36} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>No doctors found</Text>
                <Text style={styles.emptyText}>Try another specialty or keyword.</Text>
              </View>
            )
          }
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
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  pageTitle: { ...FONTS.h2, color: COLORS.text },
  pageSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  searchWrap: { marginTop: 10 },

  onlineFilterRow: { marginTop: 7, marginBottom: 2 },
  onlineFilterChip: {
    alignSelf: 'flex-start',
    height: 30,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: COLORS.success + '12',
  },
  onlineFilterChipActive: {
    backgroundColor: COLORS.success,
  },
  onlineFilterText: { ...FONTS.captionBold, color: COLORS.success, marginLeft: 6, fontSize: 12 },
  onlineFilterTextActive: { color: COLORS.textInverse },

  tabBar: { paddingTop: 8, paddingBottom: 2 },
  tabChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: COLORS.bgElevated,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: { ...FONTS.captionBold, color: COLORS.textSecondary, fontSize: 12 },
  tabTextActive: { ...FONTS.captionBold, color: COLORS.textInverse, fontSize: 12 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 90 },

  doctorCard: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 9,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'flex-start' },
  infoCol: { flex: 1, marginLeft: 8, minWidth: 0 },
  name: { ...FONTS.bodyBold, color: COLORS.text, fontSize: 13 },
  specialty: { ...FONTS.caption, color: COLORS.primary, marginTop: 1, fontSize: 12 },

  priceCol: { alignItems: 'flex-end', marginLeft: 6 },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: COLORS.success + '55',
    backgroundColor: COLORS.success + '12',
  },
  onlineBadgeText: { ...FONTS.captionBold, color: COLORS.success, marginLeft: 4, fontSize: 9 },

  inConsultationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.info + '55',
    backgroundColor: COLORS.info + '12',
  },
  inConsultationText: { ...FONTS.captionBold, color: COLORS.info, marginLeft: 4, fontSize: 9 },

  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
  },
  offlineBadgeText: { ...FONTS.small, color: COLORS.textMuted, marginLeft: 4, fontSize: 9 },

  noScheduleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
  },
  noScheduleText: { ...FONTS.small, color: COLORS.textMuted, fontSize: 8 },

  priceLabel: { ...FONTS.small, color: COLORS.textSecondary, fontSize: 10 },
  price: { ...FONTS.bodyBold, color: COLORS.doctor, marginTop: 1, fontSize: 14 },

  metaChipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 7, rowGap: 5, columnGap: 5 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaChipText: { ...FONTS.small, color: COLORS.textSecondary, marginLeft: 3, fontSize: 9 },

  actionRow: {
    flexDirection: 'row',
    columnGap: 6,
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  emptyBox: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
