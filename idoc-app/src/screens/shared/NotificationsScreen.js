import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, EmptyState, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { notificationAPI } from '../../services/api';
const typeIcon = {
  booking: 'calendar-outline',
  order: 'cube-outline',
  prescription: 'medkit-outline',
  payment: 'card-outline',
  approval: 'checkmark-circle-outline',
  reminder: 'time-outline',
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setLoadError(false);
    try {
      const { data } = await notificationAPI.list();
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        time: item.created_at ? new Date(item.created_at).toLocaleString() : 'Now',
        read: !!item.is_read,
        type: item.notification_type || 'reminder',
      }));
      setNotifications(mapped);
    } catch (error) {
      setNotifications([]);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const markAsRead = async (item) => {
    if (item.read) return;
    setNotifications((current) => current.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    try {
      await notificationAPI.markRead(item.id);
    } catch (error) {
      // Keep local read state
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    try {
      await notificationAPI.markAllRead();
    } catch (error) {
      // Keep local read state
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.md }}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Notifications</Text>
        <View style={{ marginTop: SPACING.sm }}>
          <Button title="Mark all read" size="sm" variant="outline" color={COLORS.primary} fullWidth={false} onPress={handleMarkAllRead} />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={notifications}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ padding: SPACING.xl, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={() => loadNotifications({ silent: true })}
        ListEmptyComponent={
          loadError ? (
            <Card>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Could not load notifications</Text>
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>Pull down to retry.</Text>
            </Card>
          ) : (
            <EmptyState title="No notifications" message="You're all caught up" icon={<Ionicons name="notifications-outline" size={46} color={COLORS.textMuted} />} />
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => markAsRead(item)} activeOpacity={0.85}>
          <Card style={[{ marginBottom: SPACING.sm, padding: SPACING.md }, !item.read && { borderLeftWidth: 3, borderLeftColor: COLORS.primary }]}> 
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md }}>
                <Ionicons name={typeIcon[item.type] || 'ellipse-outline'} size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...FONTS.bodyBold, color: item.read ? COLORS.textSecondary : COLORS.text }}>{item.title}</Text>
                  <Text style={{ ...FONTS.small, color: COLORS.textMuted }}>{item.time}</Text>
                </View>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>{item.body}</Text>
              </View>
            </View>
          </Card>
          </TouchableOpacity>
        )}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
});
