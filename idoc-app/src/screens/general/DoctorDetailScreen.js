import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button, Card, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';

export default function DoctorDetailScreen({ navigation, route }) {
  const { doctor } = route.params;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Avatar name={doctor.name} size={100} color={COLORS.doctor} />
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <Badge
          text={doctor.available ? 'Available Now' : 'Currently Busy'}
          color={doctor.available ? COLORS.success : COLORS.danger}
        />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Patients', value: `${doctor.patients || 1200}+`, icon: 'people-outline' },
          { label: 'Experience', value: doctor.experience, icon: 'time-outline' },
          { label: 'Rating', value: `${doctor.rating}`, icon: 'star-outline' },
        ].map((stat, i) => (
          <View key={i} style={styles.statItem}>
            <Ionicons name={stat.icon} size={18} color={COLORS.primary} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* About */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.sectionText}>
          {doctor.bio || `${doctor.name} is a highly experienced ${doctor.specialty.toLowerCase()} specialist with ${doctor.experience} of practice. Known for providing compassionate and thorough medical care to all patients.`}
        </Text>
      </Card>

      {/* Consultation Fee */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Consultation Fee</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
          <Text style={{ ...FONTS.h1, color: COLORS.primary }}>฿{doctor.fee}</Text>
          <Text style={{ ...FONTS.body, color: COLORS.textMuted, marginLeft: 8 }}>per session</Text>
        </View>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 8 }}>
          Includes video/chat consultation + prescription
        </Text>
      </Card>

      {/* Available Slots Preview */}
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Available Today</Text>
        <View style={styles.slotsRow}>
          {['9:00 AM', '10:30 AM', '1:00 PM', '3:30 PM', '5:00 PM'].map((slot, i) => (
            <TouchableOpacity
              key={i}
              style={styles.slotChip}
              onPress={() => navigation.navigate('Booking', { doctor, selectedSlot: slot })}
            >
              <Text style={styles.slotText}>{slot}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title={`Book Appointment — ฿${doctor.fee}`}
          onPress={() => navigation.navigate('Booking', { doctor })}
          disabled={!doctor.available}
        />
        <View style={{ height: SPACING.md }} />
        <View style={{ flexDirection: 'row', gap: SPACING.md }}>
          <Button
            title="Chat"
            variant="outline"
            onPress={() => navigation.navigate('ChatRoom', { recipient: doctor })}
            style={{ flex: 1 }}
          />
          <Button
            title="Call"
            variant="outline"
            onPress={() => navigation.navigate('VideoCall', { doctor })}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
  },
  name: { ...FONTS.h2, color: COLORS.text, marginTop: SPACING.lg },
  specialty: { ...FONTS.body, color: COLORS.primary, marginTop: 4, marginBottom: SPACING.md },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '30%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statValue: { ...FONTS.h4, color: COLORS.text, marginTop: 4 },
  statLabel: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  section: { marginHorizontal: SPACING.xl, marginBottom: SPACING.lg },
  sectionTitle: { ...FONTS.h4, color: COLORS.text },
  sectionText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: 8, lineHeight: 22 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  slotText: { ...FONTS.captionBold, color: COLORS.primary },
  actions: { paddingHorizontal: SPACING.xl, marginTop: SPACING.lg },
});
