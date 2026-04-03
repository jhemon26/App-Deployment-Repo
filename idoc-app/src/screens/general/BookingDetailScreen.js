import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Avatar, Badge, Button, Card, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const TIMELINE = [
  { id: 1, label: 'Booked', time: 'Today, 8:10 AM', done: true },
  { id: 2, label: 'Confirmed', time: 'Today, 8:25 AM', done: true },
  { id: 3, label: 'In Consultation', time: 'Today, 2:00 PM', done: false },
  { id: 4, label: 'Completed', time: 'After session', done: false },
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

  const handleAction = (label) => {
    Toast.show({ type: 'info', text1: label, text2: `${booking.doctor} booking updated locally for now.` });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Card style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={booking.doctor} size={64} color={COLORS.doctor} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={{ ...FONTS.h3, color: COLORS.text }}>{booking.doctor}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{booking.specialty}</Text>
            <Text style={{ ...FONTS.small, color: COLORS.primary, marginTop: 4 }}>{booking.date} • {booking.time}</Text>
          </View>
          <Badge text={booking.status} color={booking.status === 'confirmed' ? COLORS.success : COLORS.warning} size="sm" />
        </View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Visit Summary</Text>
        <View style={styles.row}><Text style={styles.label}>Type</Text><Text style={styles.value}>{booking.type === 'video' ? 'Video consultation' : 'Chat consultation'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Fee</Text><Text style={styles.value}>฿{booking.fee}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Symptoms</Text><Text style={styles.value}>{booking.symptoms || 'Not provided'}</Text></View>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Status Timeline</Text>
        {TIMELINE.map((step, index) => (
          <View key={step.id} style={{ marginBottom: index === TIMELINE.length - 1 ? 0 : SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.dot, { backgroundColor: step.done ? COLORS.success : COLORS.border }]} />
              <View style={{ flex: 1, marginLeft: SPACING.md }}>
                <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{step.label}</Text>
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{step.time}</Text>
              </View>
            </View>
            {index < TIMELINE.length - 1 && <View style={styles.line} />}
          </View>
        ))}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button title="Join Call" onPress={() => navigation.navigate('VideoCall', { doctor: { name: booking.doctor } })} style={{ flex: 1 }} />
          <Button title="Reschedule" variant="outline" color={COLORS.info} onPress={() => handleAction('Reschedule')} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
          <Button title="Message Doctor" variant="outline" color={COLORS.primary} onPress={() => navigation.navigate('ChatRoom', { recipient: { name: booking.doctor } })} style={{ flex: 1 }} />
          <Button title="Cancel" variant="outline" color={COLORS.danger} onPress={() => handleAction('Cancel')} style={{ flex: 1 }} />
        </View>
      </Card>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  hero: { marginHorizontal: SPACING.xl, marginTop: 60 },
  section: { marginHorizontal: SPACING.xl, marginTop: SPACING.lg },
  sectionTitle: { ...FONTS.h4, color: COLORS.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.lg, marginTop: SPACING.sm },
  label: { ...FONTS.body, color: COLORS.textSecondary, flex: 1 },
  value: { ...FONTS.bodyBold, color: COLORS.text, flex: 1, textAlign: 'right' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, height: 22, backgroundColor: COLORS.border, marginLeft: 6 },
});