import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, SearchBar, Badge, Button, Chip } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { pharmacyAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const MEDICINES = [
  { id: 1, name: 'Paracetamol 500mg', price: 35, category: 'Pain Relief', stock: 500, prescription: false },
  { id: 2, name: 'Amoxicillin 250mg', price: 120, category: 'Antibiotics', stock: 200, prescription: true },
  { id: 3, name: 'Cetirizine 10mg', price: 45, category: 'Allergy', stock: 300, prescription: false },
  { id: 4, name: 'Omeprazole 20mg', price: 80, category: 'Gastric', stock: 150, prescription: false },
  { id: 5, name: 'Metformin 500mg', price: 60, category: 'Diabetes', stock: 400, prescription: true },
  { id: 6, name: 'Ibuprofen 400mg', price: 40, category: 'Pain Relief', stock: 350, prescription: false },
  { id: 7, name: 'Vitamin D3 1000IU', price: 250, category: 'Supplements', stock: 600, prescription: false },
  { id: 8, name: 'Azithromycin 500mg', price: 180, category: 'Antibiotics', stock: 100, prescription: true },
];

const CATEGORIES = ['All', 'Pain Relief', 'Antibiotics', 'Allergy', 'Gastric', 'Diabetes', 'Supplements'];

export default function MedicineListScreen({ navigation, route }) {
  const pharmacy = route?.params?.pharmacy;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState({});
  const [medicines, setMedicines] = useState(MEDICINES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const { data } = await pharmacyAPI.getMedicines({ pharmacy: pharmacy?.ownerId });
        const rows = Array.isArray(data) ? data : data?.results || [];
        const mapped = rows.map((m) => ({
          id: m.id,
          name: m.name,
          price: Number(m.price || 0),
          category: m.category || 'General',
          stock: Number(m.stock || 0),
          prescription: !!m.requires_prescription,
        }));
        setMedicines(mapped.length ? mapped : MEDICINES);
      } catch (error) {
        setMedicines(MEDICINES);
      } finally {
        setLoading(false);
      }
    };

    loadMedicines();
  }, [pharmacy?.ownerId]);

  const categories = useMemo(() => {
    const dynamic = [...new Set(medicines.map((m) => m.category).filter(Boolean))];
    return dynamic.length ? ['All', ...dynamic] : CATEGORIES;
  }, [medicines]);

  const filtered = medicines.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || m.category === category;
    return matchSearch && matchCat;
  });

  const addToCart = (medicine) => {
    if (medicine.prescription) {
      Toast.show({ type: 'info', text1: 'Prescription Required', text2: 'Upload a valid prescription to order this medicine' });
      return;
    }
    setCart((prev) => ({
      ...prev,
      [medicine.id]: (prev[medicine.id] || 0) + 1,
    }));
    Toast.show({ type: 'success', text1: 'Added to cart', text2: medicine.name });
  };

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const med = medicines.find((m) => String(m.id) === String(id));
    return total + (med ? med.price * qty : 0);
  }, 0);

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: SPACING.xl, paddingTop: SPACING.md }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search medicines..." />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md }}
            renderItem={({ item }) => (
              <Chip label={item} active={category === item} onPress={() => setCategory(item)} color={COLORS.pharmacy} />
            )}
          />
        }
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.medIcon}>
                <Ionicons name="medical-outline" size={20} color={COLORS.pharmacy} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ ...FONTS.bodyBold, color: COLORS.text, flex: 1 }}>{item.name}</Text>
                  {item.prescription && <Badge text="Rx" color={COLORS.warning} size="sm" />}
                </View>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 }}>{item.category}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <Text style={{ ...FONTS.bodyBold, color: COLORS.pharmacy }}>฿{item.price}</Text>
                  {cart[item.id] ? (
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        onPress={() => setCart((p) => ({ ...p, [item.id]: Math.max(0, (p[item.id] || 0) - 1) }))}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginHorizontal: 12 }}>{cart[item.id]}</Text>
                      <TouchableOpacity
                        onPress={() => addToCart(item)}
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Button title="Add" size="sm" onPress={() => addToCart(item)} fullWidth={false} color={COLORS.pharmacy} />
                  )}
                </View>
              </View>
            </View>
          </Card>
        )}
      />
      )}

      {/* Cart Bar */}
      {cartCount > 0 && (
        <View style={styles.cartBar}>
          <View>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{cartCount} items</Text>
            <Text style={{ ...FONTS.h4, color: COLORS.pharmacy }}>฿{cartTotal}</Text>
          </View>
          <Button
            title="View Cart"
            onPress={() => navigation.navigate('Cart', { cart, medicines, pharmacy })}
            fullWidth={false}
            color={COLORS.pharmacy}
            style={{ paddingHorizontal: 24 }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  medIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: COLORS.pharmacy + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  qtyBtnText: { ...FONTS.bodyBold, color: COLORS.text },
  cartBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.bgCard, borderTopWidth: 1, borderTopColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.xl, paddingBottom: 30,
  },
});
