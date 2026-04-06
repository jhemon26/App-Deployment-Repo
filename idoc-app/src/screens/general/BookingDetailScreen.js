import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button, Card } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const statusColor = {
  confirmed: COLORS.success,
  pending: COLORS.warning,
  in_progress: COLORS.info,
  completed: COLORS.info,
  cancelled: COLORS.danger,
};

const getTimeline = (status) => [
  { id: 1, label: 'Booking Placed', sub: 'Request submitted', done: true },
  { id: 2, label: 'Confirmed', sub: 'Doctor accepted', done: ['confirmed', 'in_progress', 'completed'].includes(status) },
  { id: 3, label: 'In Consultation', sub: 'Session in progress', done: ['in_progress', 'completed'].includes(status) },
  { id: 4, label: 'Completed', sub: 'Session finished', done: status === 'completed' },
];

export default function BookingDetailScreen({ navigation, route }) {
  const booking = route?.params?.booking || {
    doctor: 'Dr. Sarah Chen',
    specialty: 'General Medicine',
    date: '2026-04-03',
    time: '2:00 PM',
    status: 'confirmed',
    type: 'video',
    fee: 500,
    symptoms: 'Headache, fever',
  };

  const sColor = statusColor[booking.status] || COLORS.textMuted;
  const timeline = getTimeline(booking.status);
  const isActive = ['confirmed', 'pending', 'in_progress'].includes(booking.status);

  const handleAction = (label) => {
    Toast.show({ type: 'info', text1: label, text2: `${booking.doctor} booking updated locally for now.` });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Card */}
      <View style={[styles.heroCard, { borderLeftColor: sColor }, SHADOWS.md]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={booking.doctor} size={64} color={COLORS.doctor} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={{ ...FONTS.h3, color: COLORS.text }}>{booking.doctor}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{booking.specialty}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: SPACING.sm }}>
              {/* Consultation type badge */}
              <View style={[styles.typeBadge, { backgroundColor: COLORS.primary + '20' }]}>
                <Ionicons
                  name={booking.type === 'video' ? 'videocam-outline' : 'chatbubble-outline'}
                  size={12}
                  color={COLORS.primary}
                />
                <Text style={{ ...FONTS.small, color: COLORS.primary, marginLeft: 4 }}>
                  {booking.type === 'video' ? 'Video' : 'Chat'}
                </Text>
              </View>
              <Badge text={booking.status} color={sColor} size="sm" />
            </View>
          </View>
        </View>
        <View style={styles.heroDateRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginLeft: 6 }}>
            {booking.date} at {booking.time}
          </Text>
        </View>
      </View>

      {/* Visit Summary */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Summary</Text>
        {[
          { label: 'Consultation Type', value: booking.type === 'video' ? 'Video Consultation' : 'Chat Consultation', icon: booking.type === 'video' ? 'videocam-outline' : 'chatbubble-outline' },
          { label: 'Consultation Fee', value: `฿${booking.fee}`, icon: 'cash-outline' },
          { label: 'Symptoms', value: booking.symptoms || 'Not provided', icon: 'medkit-outline' },
          { label: 'Date & Time', value: `${booking.date} • ${booking.time}`, icon: 'time-outline' },
        ].map((row, index) => (
          <View key={index} style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name={row.icon} size={14} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted }}>{row.label}</Text>
              <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 2 }}>{row.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* Status Timeline */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        <View style={{ marginTop: SPACING.md }}>
          {timeline.map((step, index) => (
            <View key={step.id} style={{ flexDirection: 'row' }}>
              {/* Left column: dot + line */}
              <View style={{ alignItems: 'center', width: 24 }}>
                <View style={[styles.dot, { backgroundColor: step.done ? COLORS.success : COLORS.border }]}>
                  {step.done && <Ionicons name="checkmark" size={10} color={COLORS.text} />}
                </View>
                {index < timeline.length - 1 && (
                  <View style={[styles.line, { backgroundColor: step.done ? COLORS.success + '50' : COLORS.border }]} />
                )}
              </View>
              {/* Right: label + sub */}
              <View style={{ flex: 1, marginLeft: SPACING.md, paddingBottom: index < timeline.length - 1 ? SPACING.lg : 0 }}>
                <Text style={{ ...FONTS.bodyBold, color: step.done ? COLORS.text : COLORS.textMuted }}>
                  {step.label}
                </Text>
                <Text style={{ ...FONTS.caption, color: step.done ? COLORS.textSecondary : COLORS.textMuted, marginTop: 2 }}>
                  {step.sub}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Actions */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        {isActive && (
          <>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <Button
                title="Join Call"
                onPress={() => navigation.navigate('VideoCall', { doctor: { name: booking.doctor } })}
                style={{ flex: 1 }}
              />
              <Button
                title="Message Doctor"
                variant="outline"
                color={COLORS.primary}
                onPress={() => navigation.navigate('ChatRoom', { recipient: { name: booking.doctor } })}
                style={{ flex: 1 }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <Button
                title="Reschedule"
                variant="outline"
                color={COLORS.info}
                onPress={() => handleAction('Reschedule')}
                style={{ flex: 1 }}
              />
              <Button
                title="Cancel"
                variant="outline"
                color={COLORS.danger}
                onPress={() => handleAction('Cancel')}
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
        {booking.status === 'cancelled' && (
          <View style={{ marginTop: SPACING.md }}>
            <Button
              title="Book Again"
              onPress={() => navigation.navigate('DoctorList')}
            />
          </View>
        )}
        {booking.status === 'completed' && (
          <View style={{ marginTop: SPACING.md }}>
            <View style={styles.completedNote}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginLeft: SPACING.sm }}>
                This consultation has been completed.
              </Text>
            </View>
          </View>
        )}
      </Card>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  heroDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  section: {
    marginHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 20,
  },
  completedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
});
