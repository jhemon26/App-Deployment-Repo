import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, Badge, SearchBar } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { pharmacyAPI } from '../../services/api';

const PHARMACIES = [
  { id: 1, name: 'MedPlus Pharmacy', rating: 4.5, deliveryTime: '30 min', medicines: 1200, open: true },
  { id: 2, name: 'HealthHub Drugs', rating: 4.7, deliveryTime: '45 min', medicines: 800, open: true },
  { id: 3, name: 'CareFirst Pharmacy', rating: 4.3, deliveryTime: '1 hr', medicines: 1500, open: false },
];

export default function PharmacyListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [pharmacies, setPharmacies] = useState(PHARMACIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const { data } = await pharmacyAPI.list();
        const rows = Array.isArray(data) ? data : data?.results || [];
        const mapped = rows.map((entry) => {
          const profile = entry.user ? entry : entry.pharmacy_profile || entry;
          const user = profile.user || {};
          return {
            id: profile.id,
            ownerId: user.id,
            name: profile.pharmacy_name || user.name || 'Pharmacy',
            rating: Number(profile.rating || 0),
            deliveryTime: profile.delivery_time || '30 min',
            medicines: Number(profile.medicine_count || 0),
            open: profile.is_open !== false,
            address: profile.address,
          };
        });

        setPharmacies(mapped.length ? mapped : PHARMACIES);
      } catch (error) {
        setPharmacies(PHARMACIES);
      } finally {
        setLoading(false);
      }
    };

    loadPharmacies();
  }, []);

  const filtered = useMemo(() => pharmacies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [pharmacies, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Pharmacies</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
          Order medicines & get them delivered
        </Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.lg }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search pharmacies..." />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('MedicineList', { pharmacy: item })}
            style={{ marginBottom: SPACING.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={item.name} size={56} color={COLORS.pharmacy} />
              <View style={{ flex: 1, marginLeft: SPACING.lg }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginLeft: 4 }}>{item.rating}</Text>
                  <Text style={{ ...FONTS.caption, color: COLORS.textMuted, marginHorizontal: 8 }}>•</Text>
                  <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginLeft: 4 }}>{item.deliveryTime}</Text>
                </View>
                <Text style={{ ...FONTS.small, color: COLORS.textMuted, marginTop: 2 }}>
                  {item.medicines} medicines available
                </Text>
              </View>
              <Badge
                text={item.open ? 'Open' : 'Closed'}
                color={item.open ? COLORS.success : COLORS.danger}
                size="sm"
              />
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
