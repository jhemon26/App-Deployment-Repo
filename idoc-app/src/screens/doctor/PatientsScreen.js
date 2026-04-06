import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, SearchBar, Badge, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { bookingAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function DoctorPatientsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('All');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadPatients = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setLoadError(false);
    try {
      const { data } = await bookingAPI.list();
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.reduce((accumulator, booking) => {
        const name = booking.patient_detail?.name || booking.patient_name || 'Patient';
        const existing = accumulator.find((patient) => patient.name === name);
        if (existing) {
          existing.visits += 1;
          if ((booking.date || '') > (existing.lastVisit || '')) existing.lastVisit = booking.date;
          return accumulator;
        }
        accumulator.push({
          id: booking.patient_detail?.id || booking.id,
          userId: booking.patient_detail?.id,
          name,
          age: booking.patient_detail?.age || '--',
          visits: 1,
          lastVisit: booking.date || 'Today',
          condition: booking.symptoms || 'Consultation follow-up',
        });
        return accumulator;
      }, []);
      setPatients(mapped);
    } catch (err) {
      setPatients([]);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const conditions = ['All', ...new Set(patients.map((patient) => patient.condition.split(' ')[0]))];

  const filtered = useMemo(() => patients.filter((patient) => {
    const matchesSearch = [patient.name, patient.condition, patient.age, patient.visits].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesCondition = selectedCondition === 'All' || patient.condition.toLowerCase().includes(selectedCondition.toLowerCase());
    return matchesSearch && matchesCondition;
  }), [patients, search, selectedCondition]);

  const handleMessage = (patient) => {
    navigation.navigate('ChatRoom', { recipient: { name: patient.name, role: 'general', userId: patient.userId } });
  };

  const handleReview = (patient) => {
    Toast.show({ type: 'info', text1: 'Patient reviewed', text2: `${patient.name} has been added to your attention list.` });
  };

  const renderPatientCard = ({ item }) => (
    <View style={[styles.card, SHADOWS.sm]}>
      <View style={styles.primaryRow}>
        <Avatar name={item.name} size={36} color={COLORS.general} />

        <View style={styles.infoCol}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subtitle}>Age: {item.age} • {item.condition}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Ionicons name="repeat-outline" size={11} color={COLORS.info} />
              <Text style={styles.metaText}>{item.visits} {item.visits === 1 ? 'visit' : 'visits'}</Text>
            </View>
            <View style={styles.metaChip}>
              <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
              <Text style={styles.metaText}>Last: {item.lastVisit}</Text>
            </View>
          </View>
        </View>

        <Badge text={`${item.visits}`} color={COLORS.info} size="sm" />
      </View>

      <View style={styles.actionArea}>
        <View style={styles.actionRow}>
          <Button
            title="Review"
            size="sm"
            variant="outline"
            color={COLORS.info}
            onPress={() => handleReview(item)}
            style={{ flex: 1 }}
          />
          <Button
            title="Message"
            size="sm"
            color={COLORS.general}
            onPress={() => handleMessage(item)}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>My Patients</Text>
        <Text style={styles.pageSubtitle}>{patients.length} total</Text>

        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search patients..." />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {conditions.map((item) => {
            const active = selectedCondition === item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => setSelectedCondition(item)}
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
          refreshing={refreshing}
          onRefresh={() => loadPatients({ silent: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            loadError ? (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.danger + '20' }]}> 
                  <Ionicons name="alert-circle-outline" size={32} color={COLORS.danger} />
                </View>
                <Text style={styles.emptyTitle}>Could not load patients</Text>
                <Text style={styles.emptyText}>Pull down to retry.</Text>
              </View>
            ) : (
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.general + '20' }]}> 
                  <Ionicons name="people-outline" size={32} color={COLORS.general} />
                </View>
                <Text style={styles.emptyTitle}>No patients yet</Text>
                <Text style={styles.emptyText}>Patients from completed or active bookings will appear here.</Text>
              </View>
            )
          }
          renderItem={renderPatientCard}
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
    borderRadius: RADIUS.lg,
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
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tabChipActive: { backgroundColor: COLORS.general, borderColor: COLORS.general },
  tabChipText: { ...FONTS.captionBold, color: COLORS.textSecondary, fontSize: 12 },
  tabChipTextActive: { ...FONTS.captionBold, color: COLORS.textInverse, fontSize: 12 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxxl },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.general,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'center' },
  infoCol: { flex: 1, marginLeft: 8, marginRight: 6 },
  name: { ...FONTS.bodyBold, color: COLORS.text },
  subtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 6, rowGap: 5, marginTop: 4 },
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
  metaText: { ...FONTS.small, color: COLORS.textSecondary, marginLeft: 4 },

  actionArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 7, marginTop: 7 },
  actionRow: { flexDirection: 'row', columnGap: SPACING.sm },

  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 64, height: 64, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.lg },
  emptyText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});
