import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, SearchBar, Badge, Button, Input } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
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
    } catch (err) {
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

  const filtered = useMemo(() => inventory.filter((medicine) =>
    medicine.name.toLowerCase().includes(search.toLowerCase())
  ), [inventory, search]);

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

  const renderInventoryCard = ({ item }) => {
    const stockColor = item.lowStock ? COLORS.danger : COLORS.success;

    return (
      <View style={[styles.card, { borderLeftColor: stockColor }, SHADOWS.sm]}>
        <View style={styles.primaryRow}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.pharmacy + '15' }]}>
            <Ionicons name="medical-outline" size={20} color={COLORS.pharmacy} />
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.category}>{item.category}</Text>
            <Text style={styles.price}>฿{item.price}</Text>
          </View>

          <View style={styles.rightCol}>
            <Badge text={`${item.stock} units`} color={stockColor} size="sm" />
            {item.lowStock && <Text style={styles.lowStockText}>Low Stock</Text>}
          </View>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.stockRow}>
            <Button title="-10" size="sm" variant="outline" color={COLORS.danger} onPress={() => adjustStock(item.id, -10)} style={{ flex: 1 }} fullWidth={false} />
            <Button title="-1" size="sm" variant="outline" color={COLORS.pharmacy} onPress={() => adjustStock(item.id, -1)} style={{ flex: 1 }} fullWidth={false} />
            <View style={styles.stockCountDisplay}>
              <Text style={styles.stockCountText}>{item.stock}</Text>
            </View>
            <Button title="+1" size="sm" variant="outline" color={COLORS.success} onPress={() => adjustStock(item.id, 1)} style={{ flex: 1 }} fullWidth={false} />
            <Button title="+10" size="sm" variant="outline" color={COLORS.success} onPress={() => adjustStock(item.id, 10)} style={{ flex: 1 }} fullWidth={false} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Inventory</Text>
        <Text style={styles.pageSubtitle}>{inventory.length} medicines · {totalLowStock} low stock</Text>

        {totalLowStock > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
            <Text style={styles.alertText}>
              {totalLowStock} {totalLowStock === 1 ? 'medicine is' : 'medicines are'} running low
            </Text>
          </View>
        )}

        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search inventory..." />
        </View>

        <View style={styles.addToggleWrap}>
          <Button
            title={adding ? 'Cancel' : '+ Add New Medicine'}
            variant={adding ? 'outline' : 'primary'}
            color={COLORS.pharmacy}
            onPress={() => setAdding((current) => !current)}
          />
        </View>
      </View>

      {adding && (
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Add Medicine</Text>
          <Input label="Medicine Name" placeholder="e.g. Paracetamol 500mg" value={form.name} onChangeText={(value) => updateForm('name', value)} />
          <Input label="Category" placeholder="e.g. Pain Relief" value={form.category} onChangeText={(value) => updateForm('category', value)} />

          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <Input label="Price" placeholder="e.g. 120" value={form.price} onChangeText={(value) => updateForm('price', value)} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Stock" placeholder="e.g. 250" value={form.stock} onChangeText={(value) => updateForm('stock', value)} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.formActionRow}>
            <Button title="Save Medicine" onPress={handleSave} style={{ flex: 1 }} />
            <Button title="Reset" variant="outline" color={COLORS.pharmacy} onPress={() => setForm({ name: '', price: '', stock: '', category: '' })} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.pharmacy} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => loadInventory({ silent: true })}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.pharmacy + '20' }]}> 
                <Ionicons name="medical-outline" size={32} color={COLORS.pharmacy} />
              </View>
              <Text style={styles.emptyTitle}>No medicines in inventory</Text>
              <Text style={styles.emptyText}>Add your first medicine to start receiving orders.</Text>
            </View>
          }
          renderItem={renderInventoryCard}
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

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15',
    borderWidth: 1,
    borderColor: COLORS.warning + '40',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    marginTop: 10,
  },
  alertText: { ...FONTS.captionBold, color: COLORS.warning, marginLeft: SPACING.sm, flex: 1 },

  searchWrap: { marginTop: 10 },
  addToggleWrap: { marginTop: 10 },

  formCard: { marginHorizontal: SPACING.xl, marginBottom: SPACING.md },
  formTitle: { ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md },
  formRow: { flexDirection: 'row', columnGap: SPACING.md },
  formActionRow: { flexDirection: 'row', columnGap: SPACING.sm, marginTop: SPACING.lg },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: SPACING.xxxxl },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 42, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  infoCol: { flex: 1, marginLeft: SPACING.md },
  name: { ...FONTS.bodyBold, color: COLORS.text },
  category: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  price: { ...FONTS.bodyBold, color: COLORS.primary, marginTop: 3 },

  rightCol: { alignItems: 'flex-end' },
  lowStockText: { ...FONTS.small, color: COLORS.danger, marginTop: 4, fontSize: 10 },

  actionArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm, marginTop: SPACING.sm },
  stockRow: { flexDirection: 'row', columnGap: SPACING.xs, alignItems: 'center', justifyContent: 'space-between' },
  stockCountDisplay: {
    width: 44,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stockCountText: { ...FONTS.captionBold, color: COLORS.text },

  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 64, height: 64, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.lg },
  emptyText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});
