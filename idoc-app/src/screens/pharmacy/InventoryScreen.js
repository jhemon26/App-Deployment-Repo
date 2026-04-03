import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, SearchBar, Badge, Button, Input } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { pharmacyAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function PharmacyInventoryScreen() {
  const [search, setSearch] = useState('');
  const [inventory, setInventory] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', stock: '', category: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const { data } = await pharmacyAPI.getMedicines();
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((medicine) => ({
        id: medicine.id,
        name: medicine.name,
        price: medicine.price,
        stock: medicine.stock,
        category: medicine.category,
        lowStock: medicine.is_low_stock || medicine.stock <= 20,
      }));
      setInventory(mapped);
    } catch (error) {
      setInventory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const updateForm = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const filtered = useMemo(() => inventory.filter((medicine) => medicine.name.toLowerCase().includes(search.toLowerCase())), [inventory, search]);

  const totalLowStock = inventory.filter((medicine) => medicine.lowStock || medicine.stock <= 20).length;

  const handleSave = () => {
    if (!form.name || !form.price || !form.stock || !form.category) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Fill medicine name, price, stock, and category' });
      return;
    }

    const payload = {
      name: form.name,
      price: Number(form.price),
      stock: Number(form.stock),
      category: form.category,
      description: '',
      requires_prescription: false,
      is_active: true,
    };

    pharmacyAPI.addMedicine(payload)
      .then(({ data }) => {
        const saved = data?.id ? {
          id: data.id,
          name: data.name,
          price: data.price,
          stock: data.stock,
          category: data.category,
          lowStock: data.is_low_stock || Number(data.stock) <= 20,
        } : {
          id: Date.now(),
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category,
          lowStock: Number(form.stock) <= 20,
        };
        setInventory((current) => [saved, ...current]);
        setForm({ name: '', price: '', stock: '', category: '' });
        setAdding(false);
        Toast.show({ type: 'success', text1: 'Medicine added', text2: `${saved.name} is now in your inventory` });
      })
      .catch(() => {
        const fallback = {
          id: Date.now(),
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock),
          category: form.category,
          lowStock: Number(form.stock) <= 20,
        };
        setInventory((current) => [fallback, ...current]);
        setForm({ name: '', price: '', stock: '', category: '' });
        setAdding(false);
        Toast.show({ type: 'success', text1: 'Medicine added locally', text2: `${fallback.name} was added to local inventory` });
      });
  };

  const adjustStock = (id, delta) => {
    const target = inventory.find((medicine) => medicine.id === id);
    const nextStock = target ? Math.max(0, target.stock + delta) : 0;

    setInventory((current) => current.map((medicine) => {
      if (medicine.id !== id) return medicine;
      return {
        ...medicine,
        stock: nextStock,
        lowStock: nextStock <= 20,
      };
    }));

    pharmacyAPI.updateMedicine(id, { stock: nextStock }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Inventory</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
          {inventory.length} medicines • {totalLowStock} low stock
        </Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search inventory..." />
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <Button
          title={adding ? 'Cancel Add Medicine' : '+ Add New Medicine'}
          variant={adding ? 'outline' : 'primary'}
          color={COLORS.pharmacy}
          onPress={() => setAdding((current) => !current)}
        />
      </View>

      {adding && (
        <Card style={{ marginHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
          <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Add Medicine</Text>
          <Input label="Medicine Name" placeholder="e.g. Paracetamol 500mg" value={form.name} onChangeText={(value) => updateForm('name', value)} />
          <Input label="Category" placeholder="e.g. Pain Relief" value={form.category} onChangeText={(value) => updateForm('category', value)} />
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Input label="Price" placeholder="e.g. 120" value={form.price} onChangeText={(value) => updateForm('price', value)} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Stock" placeholder="e.g. 250" value={form.stock} onChangeText={(value) => updateForm('stock', value)} keyboardType="numeric" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg }}>
            <Button title="Save Medicine" onPress={handleSave} style={{ flex: 1 }} />
            <Button title="Reset" variant="outline" color={COLORS.pharmacy} onPress={() => setForm({ name: '', price: '', stock: '', category: '' })} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxxl }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        onRefresh={() => loadInventory({ silent: true })}
        refreshing={refreshing}
        ListEmptyComponent={
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No medicines in inventory</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Add your first medicine to start receiving orders.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.pharmacy + '15', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="medical-outline" size={20} color={COLORS.pharmacy} />
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{item.category} • ฿{item.price}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Badge
                  text={item.lowStock ? `${item.stock} left` : `${item.stock} in stock`}
                  color={item.lowStock ? COLORS.danger : COLORS.success}
                  size="sm"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <Button title="- Stock" variant="outline" color={COLORS.pharmacy} size="sm" fullWidth={false} onPress={() => adjustStock(item.id, -1)} />
              <Button title="+ Stock" variant="outline" color={COLORS.success} size="sm" fullWidth={false} onPress={() => adjustStock(item.id, 1)} />
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
