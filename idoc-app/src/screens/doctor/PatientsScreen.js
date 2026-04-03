import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Card, Avatar, SearchBar, Badge, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
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
    } catch (error) {
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
  }), [search, selectedCondition]);

  const handleMessage = (patient) => {
    navigation.navigate('ChatRoom', { recipient: { name: patient.name, role: 'general', userId: patient.userId } });
  };

  const handleReview = (patient) => {
    Toast.show({ type: 'info', text1: 'Patient reviewed', text2: `${patient.name} has been added to your attention list.` });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>My Patients</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>{patients.length} total patients</Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search patients..." />
      </View>

      <FlatList
        horizontal
        data={conditions}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}
        renderItem={({ item }) => <Button title={item} size="sm" variant={selectedCondition === item ? 'primary' : 'outline'} color={COLORS.general} fullWidth={false} onPress={() => setSelectedCondition(item)} style={{ marginRight: SPACING.sm }} />}
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
        refreshing={refreshing}
        onRefresh={() => loadPatients({ silent: true })}
        ListEmptyComponent={
          loadError ? (
            <Card>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Could not load patients</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Pull down to retry.</Text>
            </Card>
          ) : (
            <Card>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No patients yet</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Patients from completed or active bookings will appear here.</Text>
            </Card>
          )
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={item.name} size={48} color={COLORS.general} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Age: {item.age} • {item.condition}</Text>
                <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 2 }}>{item.visits} visits • Last: {item.lastVisit}</Text>
              </View>
              <Badge text={`${item.visits} visits`} color={COLORS.info} size="sm" />
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <Button title="Review" size="sm" variant="outline" color={COLORS.info} onPress={() => handleReview(item)} style={{ flex: 1 }} />
              <Button title="Message" size="sm" color={COLORS.general} onPress={() => handleMessage(item)} style={{ flex: 1 }} />
            </View>
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
