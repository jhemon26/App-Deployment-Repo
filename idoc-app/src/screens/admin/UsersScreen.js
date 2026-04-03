import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Card, Avatar, Badge, SearchBar, Chip, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, ROLE_CONFIG } from '../../utils/theme';
import { adminAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const TABS = ['All', 'Patients', 'Doctors', 'Pharmacies', 'Blocked'];

export default function AdminUsersScreen() {
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
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
        status: u.is_blocked ? 'blocked' : 'active',
        joined: u.created_at ? String(u.created_at).slice(0, 10) : '',
      }));
      setUsers(mapped);
    } catch (error) {
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

  const filtered = useMemo(() => users, [users]);

  const toggleUserStatus = async (item) => {
    const block = item.status !== 'blocked';
    try {
      if (block) await adminAPI.blockUser(item.id);
      else await adminAPI.unblockUser(item.id);

      setUsers((current) => current.map((user) => (
        user.id === item.id ? { ...user, status: block ? 'blocked' : 'active' } : user
      )));
      Toast.show({ type: 'success', text1: `User ${block ? 'blocked' : 'unblocked'}` });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Update failed', text2: error.response?.data?.error || 'Please try again' });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Users</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>{users.length} total users</Text>
      </View>

      <View style={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search users..." />
      </View>

      <FlatList
        horizontal data={TABS} keyExtractor={(i) => i} showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, marginBottom: SPACING.md }}
        renderItem={({ item }) => <Chip label={item} active={tab === item} onPress={() => setTab(item)} color={COLORS.admin} />}
      />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={() => loadUsers({ silent: true })}
        ListEmptyComponent={
          <Card>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>No users found</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Try adjusting filters or search.</Text>
          </Card>
        }
        renderItem={({ item }) => {
          const roleConfig = ROLE_CONFIG[item.role];
          return (
            <Card style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={item.name} size={48} color={roleConfig.color} />
                <View style={{ flex: 1, marginLeft: SPACING.md }}>
                  <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
                  <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{item.email}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 }}>
                    <Badge text={roleConfig.label} color={roleConfig.color} size="sm" />
                    <Badge text={item.status} color={item.status === 'active' ? COLORS.success : COLORS.danger} size="sm" />
                  </View>
                </View>
                <Button
                  title={item.status === 'blocked' ? 'Unblock' : 'Block'}
                  size="sm"
                  variant="outline"
                  color={item.status === 'blocked' ? COLORS.success : COLORS.danger}
                  fullWidth={false}
                  onPress={() => toggleUserStatus(item)}
                />
              </View>
            </Card>
          );
        }}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
});
