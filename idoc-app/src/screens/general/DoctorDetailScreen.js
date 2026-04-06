import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Badge, Button, Card } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function DoctorDetailScreen({ navigation, route }) {
  const { doctor } = route.params;
  const slots = doctor.slots || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header Banner */}
      <View style={styles.banner}>
        <View style={styles.avatarWrap}>
          <Avatar name={doctor.name} size={76} color={COLORS.doctor} />
        </View>
        <Text style={styles.name}>{doctor.name}</Text>
        <Text style={styles.specialty}>{doctor.specialty}</Text>
        <View style={{ marginTop: SPACING.sm }}>
          <Badge
            text={doctor.available ? 'Available Now' : 'Currently Busy'}
            color={doctor.available ? COLORS.success : COLORS.danger}
          />
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Patients', value: `${doctor.patients || 1200}+`, icon: 'people-outline' },
          { label: 'Experience', value: doctor.experience, icon: 'time-outline' },
          { label: 'Rating', value: `${doctor.rating}`, icon: 'star-outline' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statItem, SHADOWS.sm]}>
            <View style={[styles.statIconContainer, { backgroundColor: COLORS.doctor + '20' }]}>
              <Ionicons name={stat.icon} size={18} color={COLORS.doctor} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* About */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.sectionTitle, { marginLeft: SPACING.sm }]}>About</Text>
        </View>
        <Text style={styles.sectionText}>
          {doctor.bio || `${doctor.name} is a highly experienced ${doctor.specialty?.toLowerCase() || 'medical'} specialist with ${doctor.experience} of practice. Known for providing compassionate and thorough medical care to all patients.`}
        </Text>
      </Card>

      {/* Consultation Fee */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cash-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.sectionTitle, { marginLeft: SPACING.sm }]}>Consultation Fee</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.h1, color: COLORS.primary }}>฿{doctor.fee}</Text>
          <Text style={{ ...FONTS.body, color: COLORS.textMuted, marginLeft: 8 }}>per session</Text>
        </View>
        <View style={styles.feeNote}>
          <Ionicons name="checkmark-circle-outline" size={14} color={COLORS.success} />
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginLeft: 6 }}>
            Includes video/chat consultation + prescription
          </Text>
        </View>
      </Card>

      {/* Available Slots */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={[styles.sectionTitle, { marginLeft: SPACING.sm }]}>Available Today</Text>
        </View>
        {slots.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SPACING.md }}>
            {slots.map((slot, i) => (
              <TouchableOpacity
                key={i}
                style={styles.slotChip}
                onPress={() => navigation.navigate('Booking', { doctor, selectedSlot: slot })}
              >
                <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                <Text style={styles.slotText}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noSlotsNote}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.textMuted} />
            <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginLeft: 6, flex: 1 }}>
              Contact doctor to schedule an appointment.
            </Text>
          </View>
        )}
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
            title="Video Call"
            variant="outline"
            onPress={() => navigation.navigate('VideoCall', { doctor })}
            style={{ flex: 1 }}
          />
        </View>
      </View>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  banner: {
    alignItems: 'center',
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.doctor,
    backgroundColor: COLORS.bgCard,
  },
  avatarWrap: {
    padding: 3,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.doctor + '40',
  },
  name: {
    ...FONTS.h3,
    color: COLORS.text,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  specialty: {
    ...FONTS.caption,
    color: COLORS.primary,
    marginTop: 2,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    width: '30%',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  statIconContainer: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: {
    ...FONTS.captionBold,
    color: COLORS.text,
    marginTop: 2,
  },
  statLabel: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  section: {
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  sectionText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 22,
  },
  feeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: COLORS.success + '10',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    marginRight: SPACING.sm,
    gap: SPACING.xs,
  },
  slotText: {
    ...FONTS.captionBold,
    color: COLORS.primary,
  },
  noSlotsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
  },
  actions: {
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
});
