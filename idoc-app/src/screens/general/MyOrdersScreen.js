import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Badge, Button, Card } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import useRoleDashboard from '../../hooks/useRoleDashboard';
import Toast from 'react-native-toast-message';

const statusMap = {
  processing: { label: 'Processing', color: COLORS.warning },
  on_the_way: { label: 'On the Way', color: COLORS.info },
  delivered: { label: 'Delivered', color: COLORS.success },
  cancelled: { label: 'Cancelled', color: COLORS.danger },
};

const PROGRESS_STEPS = ['Placed', 'Packed', 'In Transit', 'Delivered'];
const progressIndex = { processing: 1, on_the_way: 2, delivered: 3, cancelled: -1 };
const TAB_KEYS = ['All', 'processing', 'on_the_way', 'delivered', 'cancelled'];

const normalizeStatus = (value) => String(value || '').toLowerCase().trim();

const extractItemNames = (order) => {
  const rows = Array.isArray(order?.items)
    ? order.items
    : Array.isArray(order?.items_detail)
      ? order.items_detail
      : Array.isArray(order?.order_items)
        ? order.order_items
        : [];

  return rows
    .map((row) => row?.medicine_name || row?.medicine?.name || row?.name || row?.title)
    .filter(Boolean);
};

export default function MyOrdersScreen({ navigation, route }) {
  const { dashboard, loading, error, refresh } = useRoleDashboard('general');
  const [tab, setTab] = useState('All');
  const [orders, setOrders] = useState([]);

  const suggestReorder = route?.params?.suggestReorder === true;

  useEffect(() => {
    const liveOrders = (dashboard?.orders || []).map((order) => {
      const itemNames = extractItemNames(order);
      const itemCount = itemNames.length || order.item_count || (typeof order.items === 'number' ? order.items : 1);
      return {
        id: order.id,
        pharmacy: order.pharmacy?.pharmacy_name || order.pharmacy?.name || 'Assigned Pharmacy',
        items: itemCount,
        itemNames,
        total: Number(order.total_amount || order.total || 0),
        status: order.status,
        date: order.created_at ? String(order.created_at).slice(0, 10) : 'Today',
      };
    });
    setOrders(liveOrders);
  }, [dashboard]);

  const filtered = useMemo(() => {
    if (tab === 'All') return orders;
    return orders.filter((order) => normalizeStatus(order.status) === tab);
  }, [orders, tab]);

  const reorderSuggestions = useMemo(() => {
    const delivered = orders.filter((order) => normalizeStatus(order.status) === 'delivered');
    const countMap = new Map();

    delivered.forEach((order) => {
      order.itemNames.forEach((name) => {
        const prev = countMap.get(name) || 0;
        countMap.set(name, prev + 1);
      });
    });

    return Array.from(countMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [orders]);

  const trackOrder = (order) => {
    Toast.show({ type: 'info', text1: 'Tracking order', text2: `${order.id} is currently ${statusMap[order.status]?.label || order.status}` });
  };

  const reorder = (order) => {
    Toast.show({ type: 'success', text1: 'Reorder started', text2: `${order.pharmacy} items were added back to your cart` });
    navigation.navigate('Pharmacy');
  };

  const reorderFromSuggestion = (itemName) => {
    Toast.show({ type: 'success', text1: 'Suggested reorder', text2: `Look for ${itemName} to purchase again` });
    navigation.navigate('Pharmacy', { search: itemName });
  };

  const renderProgressDots = (status) => {
    const current = progressIndex[status] ?? -1;
    return (
      <View style={styles.progressRow}>
        {PROGRESS_STEPS.map((step, index) => {
          const done = current >= index;
          const active = current === index;
          const color = done ? statusMap[status]?.color || COLORS.success : COLORS.border;
          return (
            <View key={index} style={styles.progressItem}>
              <View style={[styles.progressDot, {
                backgroundColor: done ? color : 'transparent',
                borderColor: active ? color : done ? color : COLORS.border,
                width: active ? 11 : 9,
                height: active ? 11 : 9,
                borderRadius: 6,
              }]} />
              <Text style={[styles.progressLabel, { color: done ? color : COLORS.textMuted }]} numberOfLines={1}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderOrderCard = ({ item }) => {
    const s = statusMap[item.status] || { label: item.status, color: COLORS.textMuted };

    return (
      <View style={[styles.card, { borderLeftColor: s.color }, SHADOWS.sm]}>
        <View style={styles.primaryRow}>
          <View style={[styles.iconContainer, { backgroundColor: COLORS.pharmacy + '14' }]}>
            <Ionicons name="storefront-outline" size={15} color={COLORS.pharmacy} />
          </View>

          <View style={styles.infoCol}>
            <Text style={styles.pharmacyName} numberOfLines={1}>{item.pharmacy}</Text>
            <Text style={styles.metaText} numberOfLines={1}>Order #{item.id}</Text>
            <Text style={styles.metaText} numberOfLines={1}>{item.items} {item.items === 1 ? 'item' : 'items'} • {item.date}</Text>
          </View>

          <View style={styles.rightCol}>
            <Badge text={s.label} color={s.color} size="sm" />
            <Text style={styles.total}>฿{item.total}</Text>
          </View>
        </View>

        {item.status !== 'cancelled' && (
          <View style={styles.progressBox}>
            {renderProgressDots(item.status)}
          </View>
        )}

        <View style={styles.actionArea}>
          <View style={styles.actionRow}>
            <Button
              title="Track"
              size="sm"
              variant="outline"
              color={COLORS.info}
              onPress={() => trackOrder(item)}
              style={{ flex: 1 }}
            />
            {normalizeStatus(item.status) === 'delivered' && (
              <Button
                title="Reorder"
                size="sm"
                color={COLORS.pharmacy}
                onPress={() => reorder(item)}
                style={{ flex: 1.1 }}
              />
            )}
          </View>

          <View style={styles.secondaryAction}>
            <Button
              title="View Details"
              size="sm"
              variant="outline"
              color={COLORS.primary}
              onPress={() => navigation.navigate('OrderDetail', { order: item })}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>My Orders</Text>
        <Text style={styles.pageSubtitle}>Track your medicine deliveries</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TAB_KEYS.map((item) => {
            const active = tab === item;
            const label = item === 'All' ? 'All' : statusMap[item]?.label || item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => setTab(item)}
                style={[styles.tabChip, active && styles.tabChipActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {reorderSuggestions.length > 0 && (
        <Card style={[styles.suggestionCard, suggestReorder && styles.suggestionCardFocused]}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="reload-outline" size={16} color={COLORS.pharmacy} />
            <Text style={styles.suggestionTitle}>Reorder Suggestions</Text>
          </View>
          <Text style={styles.suggestionSubtitle}>Based on medicines you purchased before</Text>
          <View style={styles.suggestionRow}>
            {reorderSuggestions.map((item) => (
              <TouchableOpacity key={item.name} style={styles.suggestionChip} onPress={() => reorderFromSuggestion(item.name)} activeOpacity={0.8}>
                <Text style={styles.suggestionChipText} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.suggestionChipMeta}>x{item.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : error ? (
            <TouchableOpacity style={styles.retryBox} onPress={refresh}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
              <Text style={styles.retryText}>Could not load orders. Tap to retry.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.pharmacy + '20' }]}>
                <Ionicons name="cube-outline" size={28} color={COLORS.pharmacy} />
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>Your medicine orders will appear here once you place them.</Text>
            </View>
          )
        }
        renderItem={renderOrderCard}
      />
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

  tabBar: { paddingTop: 10, paddingBottom: 2 },
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
  tabChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { ...FONTS.captionBold, color: COLORS.textSecondary, fontSize: 12 },
  tabTextActive: { ...FONTS.captionBold, color: COLORS.textInverse, fontSize: 12 },

  suggestionCard: {
    marginHorizontal: SPACING.xl,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.pharmacy + '40',
    backgroundColor: COLORS.pharmacy + '10',
    padding: 10,
  },
  suggestionCardFocused: {
    borderColor: COLORS.pharmacy,
  },
  suggestionHeader: { flexDirection: 'row', alignItems: 'center', columnGap: 6 },
  suggestionTitle: { ...FONTS.captionBold, color: COLORS.text },
  suggestionSubtitle: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 3 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: '48%',
  },
  suggestionChipText: { ...FONTS.small, color: COLORS.text, flexShrink: 1 },
  suggestionChipMeta: { ...FONTS.small, color: COLORS.pharmacy, marginLeft: 6, fontSize: 10 },

  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 90 },
  loadingBox: { paddingTop: SPACING.xxxl, alignItems: 'center' },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    padding: 11,
  },
  primaryRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: { flex: 1, marginLeft: 8, minWidth: 0 },
  pharmacyName: { ...FONTS.bodyBold, color: COLORS.text },
  metaText: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },

  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  total: { ...FONTS.captionBold, color: COLORS.pharmacy, marginTop: 5 },

  progressBox: { marginTop: 10 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  progressItem: { alignItems: 'center', flex: 1 },
  progressDot: { borderWidth: 2 },
  progressLabel: { ...FONTS.small, marginTop: 3, fontSize: 9 },

  actionArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 10,
    paddingTop: 9,
  },
  actionRow: { flexDirection: 'row', columnGap: 8 },
  secondaryAction: { marginTop: 8 },

  retryBox: {
    marginTop: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    padding: SPACING.md,
    alignItems: 'center',
  },
  retryText: { ...FONTS.caption, color: COLORS.textSecondary },
  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
