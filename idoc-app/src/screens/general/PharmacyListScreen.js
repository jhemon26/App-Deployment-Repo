import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, Badge, SearchBar, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { pharmacyAPI } from '../../services/api';

export default function PharmacyListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPharmacies = async () => {
    setLoading(true);
    setError(null);
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
      setPharmacies(mapped);
    } catch (err) {
      setPharmacies([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacies();
  }, []);

  const filtered = useMemo(() => pharmacies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  ), [pharmacies, search]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Pharmacies</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>
          Order medicines and get them delivered
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search pharmacies..." />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          error ? (
            <Card style={{ marginTop: SPACING.md }}>
              <View style={{ alignItems: 'center', paddingVertical: SPACING.sm }}>
                <Ionicons name="alert-circle-outline" size={32} color={COLORS.danger} />
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: SPACING.sm }}>Could not load pharmacies</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' }}>Check your connection and try again</Text>
                <Button title="Retry" onPress={loadPharmacies} style={{ marginTop: SPACING.sm }} />
              </View>
            </Card>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="storefront-outline" size={34} color={COLORS.textMuted} />
              <Text style={{ ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md }}>No pharmacies found</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>Try a different search</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('MedicineList', { pharmacy: item })}
            style={styles.pharmacyCard}
          >
            <View style={styles.cardHeaderRow}>
              <Avatar name={item.name} size={44} color={COLORS.pharmacy} />
              <View style={styles.mainInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Badge
                    text={item.open ? 'Open' : 'Closed'}
                    color={item.open ? COLORS.success : COLORS.danger}
                    size="sm"
                  />
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="star" size={12} color={COLORS.warning} />
                  <Text style={styles.metaText}>{item.rating}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{item.deliveryTime}</Text>
                </View>
                <Text style={styles.secondaryMeta}>{item.medicines} medicines available</Text>
              </View>
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
  header: { paddingHorizontal: SPACING.xl, paddingTop: 52, paddingBottom: SPACING.xs },
  searchWrap: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xs },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 84 },
  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  pharmacyCard: { marginBottom: SPACING.sm },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  mainInfo: { flex: 1, marginLeft: SPACING.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...FONTS.bodyBold, color: COLORS.text, flex: 1, marginRight: SPACING.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  metaText: { ...FONTS.caption, color: COLORS.textSecondary, marginLeft: 4 },
  metaDot: { ...FONTS.caption, color: COLORS.textMuted, marginHorizontal: 6 },
  secondaryMeta: { ...FONTS.small, color: COLORS.textMuted, marginTop: 1 },
});
