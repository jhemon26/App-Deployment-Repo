import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Avatar, EmptyState } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRooms = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    try {
      const { data } = await chatAPI.getRooms();
      const rows = Array.isArray(data) ? data : data?.results || [];
      const mapped = rows.map((room) => {
        const participants = room.participants_detail || [];
        const other = participants.find((participant) => participant.id !== user?.id) || participants[0] || {};
        return {
          id: room.id,
          roomId: room.id,
          userId: other.id,
          name: other.name || 'Contact',
          lastMessage: room.last_message?.content || 'No messages yet',
          time: room.last_message?.time ? new Date(room.last_message.time).toLocaleString() : 'Just now',
          unread: Number(room.unread_count || 0),
          online: false,
          role: other.role,
        };
      });

      setChats(mapped);
    } catch (error) {
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
      <FlatList
        data={chats}
        keyExtractor={(i) => i.id.toString()}
        contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: 100 }}
        refreshing={refreshing}
        onRefresh={() => loadRooms({ silent: true })}
        ListEmptyComponent={<EmptyState title="No messages" message="Start a conversation" icon={<Ionicons name="chatbubble-ellipses-outline" size={46} color={COLORS.textMuted} />} />}
        renderItem={({ item }) => (
          <Card
            onPress={() => navigation.navigate('ChatRoom', { recipient: item, roomId: item.roomId })}
            style={{ marginBottom: SPACING.sm, padding: SPACING.md }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Avatar name={item.name} size={50} color={COLORS.primary} />
                {item.online && (
                  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.bgCard }} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{item.name}</Text>
                  <Text style={{ ...FONTS.small, color: COLORS.textMuted }}>{item.time}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <Text style={{ ...FONTS.caption, color: item.unread ? COLORS.text : COLORS.textSecondary, flex: 1 }} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  {item.unread > 0 && (
                    <View style={{ backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginLeft: 8 }}>
                      <Text style={{ ...FONTS.small, color: COLORS.white }}>{item.unread}</Text>
                    </View>
                  )}
                </View>
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
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
});
