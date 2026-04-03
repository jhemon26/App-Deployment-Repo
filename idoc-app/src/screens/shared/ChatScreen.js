import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { chatAPI } from '../../services/api';

export default function ChatScreen({ navigation, route }) {
  const { user } = useAuth();
  const recipient = route?.params?.recipient;
  const roomId = route?.params?.roomId;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [activeRoomId, setActiveRoomId] = useState(roomId || null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        let resolvedRoomId = roomId;
        if (!resolvedRoomId && recipient?.userId) {
          const roomResp = await chatAPI.createRoom({ user_id: recipient.userId });
          resolvedRoomId = roomResp?.data?.id;
        }

        if (!resolvedRoomId) {
          setMessages([]);
          return;
        }

        setActiveRoomId(resolvedRoomId);
        const { data } = await chatAPI.getMessages(resolvedRoomId);
        const rows = Array.isArray(data) ? data : data?.results || [];
        const mapped = rows.map((msg) => ({
          id: msg.id,
          text: msg.content,
          sender: (msg.sender === user?.id || msg.sender?.id === user?.id) ? 'me' : 'other',
          time: msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
        }));
        setMessages(mapped);
      } catch (error) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [recipient?.userId, roomId, user?.id]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending) return;

    let resolvedRoomId = activeRoomId;
    if (!resolvedRoomId && recipient?.userId) {
      try {
        const roomResp = await chatAPI.createRoom({ user_id: recipient.userId });
        resolvedRoomId = roomResp?.data?.id;
        setActiveRoomId(resolvedRoomId || null);
      } catch (error) {
        return;
      }
    }

    if (!resolvedRoomId) return;

    const newMsg = {
      id: Date.now(),
      text: content,
      sender: 'me',
      time: new Date().toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      setSending(true);
      await chatAPI.sendMessage(resolvedRoomId, { content, message_type: 'text' });
    } catch (error) {
      // Keep optimistic local message
    } finally {
      setSending(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: recipient?.name || 'Chat' });
  }, [navigation, recipient]);

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        {!isMe && <Avatar name={recipient?.name || '?'} size={32} color={COLORS.primary} style={{ marginRight: 8 }} />}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMe && { color: COLORS.textInverse }]}>{item.text}</Text>
          <Text style={[styles.msgTime, isMe && { color: COLORS.textInverse + '99' }]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptyText}>Start the conversation to get medical support quickly.</Text>
            </View>
          }
          contentContainerStyle={{
            padding: SPACING.lg,
            paddingBottom: SPACING.xl,
            flexGrow: 1,
            justifyContent: messages.length ? 'flex-start' : 'center',
          }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={() => navigation.navigate('VideoCall', { doctor: recipient })}
          style={styles.actionBtn}
        >
          <Ionicons name="videocam-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={sendMessage} style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}>
          <Ionicons name="paper-plane" size={15} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', padding: SPACING.md, borderRadius: RADIUS.lg },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.bgElevated, borderBottomLeftRadius: 4 },
  msgText: { ...FONTS.body, color: COLORS.text },
  msgTime: { ...FONTS.small, color: COLORS.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: { ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.sm },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, textAlign: 'center' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xxl : SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 6,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 4,
  },
});
