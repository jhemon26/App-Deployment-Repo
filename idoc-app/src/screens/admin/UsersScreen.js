import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, SearchBar, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, ROLE_CONFIG } from '../../utils/theme';
import { adminAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Patients', 'Doctors', 'Pharmacies', 'Blocked'];

const normalizeTab = (value) => {
  if (!value) return 'All';
  const match = TABS.find((tab) => tab.toLowerCase() === String(value).toLowerCase());
  return match || 'All';
};

export default function AdminUsersScreen({ navigation, route }) {
  const [tab, setTab] = useState(normalizeTab(route?.params?.initialTab));
  const [search, setSearch] = useState(route?.params?.initialSearch || '');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getParams = () => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (tab === 'Doctors') params.role = 'doctor';
    if (tab === 'Pharmacies') params.role = 'pharmacy';
    if (tab === 'Patients') params.role = 'general';
    if (tab === 'Blocked') params.is_blocked = true;
    return params;
  };

  const loadUsers = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const { data } = await adminAPI.getUsers(getParams());
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        specialty: u.doctor_profile?.specialty || u.pharmacy_profile?.pharmacy_name || null,
        status: u.is_blocked ? 'blocked' : 'active',
        joined: u.created_at ? String(u.created_at).slice(0, 10) : '',
        is_approved: u.is_approved,
      }));
      setUsers(mapped);
    } catch (err) {
      setUsers([]);
      Toast.show({ type: 'error', text1: 'Could not load users', text2: 'Pull down to retry.' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timeout);
  }, [tab, search]);

  useEffect(() => {
    const nextTab = normalizeTab(route?.params?.initialTab);
    if (nextTab && nextTab !== tab) {
      setTab(nextTab);
    }

    const nextSearch = route?.params?.initialSearch ?? '';
    if (typeof nextSearch === 'string' && nextSearch !== search) {
      setSearch(nextSearch);
    }

    if (route?.params?.requestRefreshAt) {
      loadUsers({ silent: true });
    }
  }, [route?.params?.initialTab, route?.params?.initialSearch, route?.params?.requestRefreshAt]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchTab =
        tab === "All" ||
        (tab === "Doctors" && u.role === "doctor") ||
        (tab === "Pharmacies" && u.role === "pharmacy") ||
        (tab === "Patients" && u.role === "general") ||
        (tab === "Blocked" && u.status === "blocked");

      if (!matchTab) return false;
      if (!q) return true;

      return [u.name, u.email, u.role, u.specialty]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [users, tab, search]);

  const toggleUserStatus = async (item) => {
    const block = item.status !== 'blocked';
    try {
      if (block) await adminAPI.blockUser(item.id);
      else await adminAPI.unblockUser(item.id);

      setUsers((current) => current.map((user) => (
        user.id === item.id ? { ...user, status: block ? 'blocked' : 'active' } : user
      )));
      Toast.show({ type: 'success', text1: `User ${block ? 'blocked' : 'unblocked'}` });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: err.response?.data?.error || 'Please try again' });
    }
  };

  const handleViewDetails = (item) => {
    if (item.role === 'doctor' || item.role === 'pharmacy') {
      navigation.navigate('AdminDoctorDetail', {
        item: {
          ...item,
          type: item.role,
          license: null,
          submitted: item.joined,
        },
      });
    } else {
      Toast.show({
        type: 'info',
        text1: item.name,
        text2: `${item.email} · Joined ${item.joined || 'N/A'}`,
      });
    }
  };

  const renderUserCard = ({ item }) => {
    const roleConfig = ROLE_CONFIG[item.role] || { color: COLORS.textMuted, label: item.role };
    const isBlocked = item.status === 'blocked';

    return (
      <View style={[styles.card, { borderLeftColor: isBlocked ? COLORS.danger : roleConfig.color }, SHADOWS.sm]}>
        <View style={styles.cardHeaderRow}>
          <Avatar name={item.name} size={34} color={isBlocked ? COLORS.textMuted : roleConfig.color} />

          <View style={styles.mainInfo}>
            <Text style={[styles.name, { color: isBlocked ? COLORS.textSecondary : COLORS.text }]}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            {!!item.specialty && <Text style={styles.specialty}>{item.specialty}</Text>}

            {!!item.joined && (
              <View style={styles.joinedRow}>
                <Ionicons name="calendar-outline" size={11} color={COLORS.textMuted} />
                <Text style={styles.joinedText}>Joined {item.joined}</Text>
              </View>
            )}
          </View>

          <View style={styles.trailingInfo}>
            <Badge text={roleConfig.label} color={isBlocked ? COLORS.textMuted : roleConfig.color} size="sm" />
            <Badge text={isBlocked ? 'Blocked' : 'Active'} color={isBlocked ? COLORS.danger : COLORS.success} size="sm" />
          </View>
        </View>

        <View style={styles.actionArea}>
          <View style={styles.actionRow}>
            <Button
              title="View Details"
              size="sm"
              variant="outline"
              color={COLORS.admin}
              onPress={() => handleViewDetails(item)}
              style={{ flex: 1 }}
            />
            <Button
              title={isBlocked ? 'Unblock' : 'Block'}
              size="sm"
              variant="outline"
              color={isBlocked ? COLORS.success : COLORS.danger}
              onPress={() => toggleUserStatus(item)}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.pageTitle}>Users</Text>
        <Text style={styles.pageSubtitle}>
          {users.length} total · {users.filter((u) => u.status === 'blocked').length} blocked
        </Text>

        <View style={styles.searchWrap}>
          <SearchBar value={search} onChangeText={setSearch} placeholder="Search users..." />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map((item) => {
            const active = tab === item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.8}
                onPress={() => setTab(item)}
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
          <ActivityIndicator size="large" color={COLORS.admin} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => loadUsers({ silent: true })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: COLORS.admin + '20' }]}> 
                <Ionicons name="people-outline" size={28} color={COLORS.admin} />
              </View>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>Try adjusting filters or search.</Text>
            </View>
          }
          renderItem={renderUserCard}
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
  tabChipActive: { backgroundColor: COLORS.admin, borderColor: COLORS.admin },
  tabChipText: { ...FONTS.captionBold, color: COLORS.textSecondary, fontSize: 12 },
  tabChipTextActive: { ...FONTS.captionBold, color: COLORS.textInverse, fontSize: 12 },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContainer: { paddingHorizontal: SPACING.xl, paddingBottom: 84 },

  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  mainInfo: { flex: 1, marginLeft: 8 },
  name: { ...FONTS.bodyBold },
  email: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 1 },
  specialty: { ...FONTS.small, color: COLORS.primary, marginTop: 1 },
  joinedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, columnGap: 4 },
  joinedText: { ...FONTS.small, color: COLORS.textMuted },
  trailingInfo: { alignItems: 'flex-end', rowGap: 2 },

  actionArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 7, marginTop: 7 },
  actionRow: { flexDirection: 'row', columnGap: SPACING.sm },

  emptyStateContainer: { alignItems: 'center', paddingTop: SPACING.xxxl, paddingHorizontal: SPACING.xl },
  emptyIconCircle: { width: 56, height: 56, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginTop: SPACING.md },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
});
