import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');

export default function VideoCallScreen({ navigation, route }) {
  const other = route?.params?.doctor || route?.params?.patient || { name: 'User' };
  const [callState, setCallState] = useState('connecting'); // connecting, active, ended
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    // Simulate connection
    const connectTimer = setTimeout(() => setCallState('active'), 2000);
    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callState !== 'active') return;
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, [callState]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    setCallState('ended');
    setTimeout(() => navigation.goBack(), 1000);
  };

  return (
    <View style={styles.container}>
      {/* Remote Video Placeholder */}
      <View style={styles.remoteVideo}>
        {callState === 'connecting' ? (
          <View style={styles.connectingOverlay}>
            <Avatar name={other.name} size={100} color={COLORS.primary} />
            <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: SPACING.lg }}>{other.name}</Text>
            <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm }}>Connecting...</Text>
            <View style={styles.dots}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.dot, { opacity: 0.3 + (i * 0.3) }]} />
              ))}
            </View>
          </View>
        ) : callState === 'ended' ? (
          <View style={styles.connectingOverlay}>
            <Ionicons name="call-outline" size={44} color={COLORS.textMuted} />
            <Text style={{ ...FONTS.h3, color: COLORS.text, marginTop: SPACING.lg }}>Call Ended</Text>
            <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.sm }}>
              Duration: {formatDuration(duration)}
            </Text>
          </View>
        ) : (
          <View style={styles.activeCallOverlay}>
            <View style={styles.topBar}>
              <View style={styles.callInfo}>
                <View style={styles.liveDot} />
                <Text style={{ ...FONTS.captionBold, color: COLORS.text }}>{formatDuration(duration)}</Text>
              </View>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{other.name}</Text>
            </View>

            {/* Simulated video feed placeholder */}
            <View style={styles.videoPlaceholder}>
              <Avatar name={other.name} size={120} color={COLORS.primary} />
              <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.md }}>
                Secure call preview active
              </Text>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted }}>
                Encrypted media stream initializing
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Local Video Preview */}
      {callState === 'active' && (
        <View style={styles.localVideo}>
          <Avatar name="You" size={40} color={COLORS.info} />
          {videoOff && (
            <View style={styles.videoOffOverlay}>
              <Ionicons name="videocam-off-outline" size={16} color={COLORS.textMuted} />
            </View>
          )}
        </View>
      )}

      {/* Controls */}
      {callState !== 'ended' && (
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, muted && styles.controlBtnActive]}
            onPress={() => setMuted(!muted)}
          >
            <Ionicons name={muted ? 'mic-off-outline' : 'mic-outline'} size={20} color={COLORS.text} />
            <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, videoOff && styles.controlBtnActive]}
            onPress={() => setVideoOff(!videoOff)}
          >
            <Ionicons name={videoOff ? 'videocam-off-outline' : 'videocam-outline'} size={20} color={COLORS.text} />
            <Text style={styles.controlLabel}>{videoOff ? 'Start' : 'Stop'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.endCallBtn} onPress={endCall}>
            <Ionicons name="call" size={24} color={COLORS.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn} onPress={() => navigation.navigate('ChatRoom', { recipient: { name: other.name, userId: other.userId }, roomId: other.roomId })}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.text} />
            <Text style={styles.controlLabel}>Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn}>
            <Ionicons name="volume-high-outline" size={20} color={COLORS.text} />
            <Text style={styles.controlLabel}>Speaker</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  remoteVideo: { flex: 1 },
  connectingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  activeCallOverlay: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 60,
  },
  callInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', marginTop: SPACING.lg, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: SPACING.xl,
    width: 100,
    height: 140,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  videoOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgCard + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.xl,
    paddingBottom: 40,
    backgroundColor: COLORS.bgCard + 'DD',
  },
  controlBtn: {
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.bgElevated,
    justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: COLORS.primary + '30' },
  controlLabel: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '135deg' }],
  },
});
