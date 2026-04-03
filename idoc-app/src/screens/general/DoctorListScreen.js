import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, Badge, SearchBar, Chip } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { doctorAPI } from '../../services/api';

const DOCTORS = [
  { id: 1, name: 'Dr. Sarah Chen', specialty: 'General Medicine', rating: 4.9, fee: 500, available: true, experience: '12 years', patients: 1200 },
  { id: 2, name: 'Dr. James Okafor', specialty: 'Pediatrics', rating: 4.8, fee: 600, available: true, experience: '8 years', patients: 800 },
  { id: 3, name: 'Dr. Aisha Patel', specialty: 'Dermatology', rating: 4.7, fee: 700, available: false, experience: '15 years', patients: 2000 },
  { id: 4, name: 'Dr. Marcus Lee', specialty: 'Cardiology', rating: 4.9, fee: 900, available: true, experience: '20 years', patients: 3500 },
  { id: 5, name: 'Dr. Elena Ruiz', specialty: 'Psychiatry', rating: 4.6, fee: 800, available: true, experience: '10 years', patients: 600 },
  { id: 6, name: 'Dr. Raj Mehta', specialty: 'Orthopedics', rating: 4.5, fee: 750, available: true, experience: '14 years', patients: 1800 },
];

const SPECIALTIES = ['All', 'General Medicine', 'Pediatrics', 'Dermatology', 'Cardiology', 'Psychiatry', 'Orthopedics'];

export default function DoctorListScreen({ navigation, route }) {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState(route?.params?.specialty || 'All');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDoctors = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSpecialty !== 'All') params.specialty = selectedSpecialty;
      if (search.trim()) params.search = search.trim();

      const { data } = await doctorAPI.list(params);
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((entry) => {
        const profile = entry.user ? entry : entry.doctor_profile || entry;
        const user = profile.user || {};
        return {
          id: profile.id,
          doctorProfileId: profile.id,
          userId: user.id,
          name: user.name || profile.name || 'Doctor',
          specialty: profile.specialty || 'General Medicine',
          rating: Number(profile.rating || 0),
          fee: Number(profile.fee || 0),
          available: profile.is_available !== false,
          experience: profile.experience || 'Experience not listed',
          patients: Number(profile.total_patients || 0),
          bio: profile.bio,
        };
      });

      setDoctors(mapped);
    } catch (error) {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedSpecialty]);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useFocusEffect(
    React.useCallback(() => {
      loadDoctors();
    }, [loadDoctors])
  );

  const filtered = useMemo(() => doctors.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = selectedSpecialty === 'All' || d.specialty === selectedSpecialty;
    return matchSearch && matchSpecialty;
  }), [doctors, search, selectedSpecialty]);

  const specialties = useMemo(() => {
    const dynamic = [...new Set(doctors.map((d) => d.specialty).filter(Boolean))];
    return dynamic.length ? ['All', ...dynamic] : SPECIALTIES;
  }, [doctors]);

  const renderDoctor = ({ item }) => (
    <Card
      onPress={() => navigation.navigate('DoctorDetail', { doctor: item })}
      style={styles.doctorCard}
    >
      <View style={{ flexDirection: 'row' }}>
        <Avatar name={item.name} size={60} color={COLORS.doctor} />
        <View style={{ flex: 1, marginLeft: SPACING.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text, flex: 1 }}>{item.name}</Text>
            <Badge
              text={item.available ? 'Available' : 'Busy'}
              color={item.available ? COLORS.success : COLORS.textMuted}
              size="sm"
            />
          </View>
          <Text style={{ ...FONTS.caption, color: COLORS.primary, marginTop: 2 }}>{item.specialty}</Text>
          <View style={styles.doctorMeta}>
            <Ionicons name="star" size={12} color={COLORS.warning} />
            <Text style={[styles.metaText, { marginLeft: 4 }]}>{item.rating}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.experience}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>{item.patients}+ patients</Text>
          </View>
          <View style={styles.feeRow}>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.primary }}>฿{item.fee}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textMuted }}> / consultation</Text>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Find a Doctor</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
          {filtered.length} doctors available
        </Text>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search doctors, specialties..." />
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: SPACING.md }}
      >
        {specialties.map((s) => (
          <Chip
            key={s}
            label={s}
            active={selectedSpecialty === s}
            onPress={() => setSelectedSpecialty(s)}
          />
        ))}
      </ScrollView>

      {/* Doctor List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDoctor}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="search" size={40} color={COLORS.textMuted} />
            <Text style={{ ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md }}>No doctors found</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Try a different search</Text>
          </View>
        }
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
  doctorCard: { marginBottom: SPACING.md },
  doctorMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { ...FONTS.small, color: COLORS.textSecondary },
  metaDot: { ...FONTS.small, color: COLORS.textMuted, marginHorizontal: 6 },
  feeRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
});
