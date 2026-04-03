import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar, Button, Card, Input, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { bookingAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const DATES = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return {
    full: date.toISOString().split('T')[0],
    day: date.toLocaleDateString('en', { weekday: 'short' }),
    date: date.getDate(),
    month: date.toLocaleDateString('en', { month: 'short' }),
  };
});

const TIME_SLOTS = [
  { time: '9:00 AM', available: true },
  { time: '9:30 AM', available: false },
  { time: '10:00 AM', available: true },
  { time: '10:30 AM', available: true },
  { time: '11:00 AM', available: true },
  { time: '11:30 AM', available: false },
  { time: '1:00 PM', available: true },
  { time: '1:30 PM', available: true },
  { time: '2:00 PM', available: true },
  { time: '3:00 PM', available: true },
  { time: '3:30 PM', available: false },
  { time: '4:00 PM', available: true },
  { time: '5:00 PM', available: true },
];

export default function BookingScreen({ navigation, route }) {
  const { doctor, selectedSlot } = route.params;
  const [selectedDate, setSelectedDate] = useState(DATES[0].full);
  const [selectedTime, setSelectedTime] = useState(selectedSlot || null);
  const [consultationType, setConsultationType] = useState('video');
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!selectedTime) {
      Toast.show({ type: 'error', text1: 'Select a time slot' });
      return;
    }
    setLoading(true);
    try {
      await bookingAPI.create({
        doctor: doctor.id,
        date: selectedDate,
        time_slot: selectedTime,
        consultation_type: consultationType,
        symptoms,
      });
      setLoading(false);
      Toast.show({ type: 'success', text1: 'Booking Confirmed!', text2: `Appointment with ${doctor.name}` });
      navigation.goBack();
    } catch (error) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Booking failed', text2: error.response?.data?.error || 'Please try again' });
    }
  };

  const selectedDateObj = DATES.find((d) => d.full === selectedDate);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Doctor Summary */}
      <Card style={styles.doctorCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={doctor.name} size={50} color={COLORS.doctor} />
          <View style={{ marginLeft: SPACING.md, flex: 1 }}>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>{doctor.name}</Text>
            <Text style={{ ...FONTS.caption, color: COLORS.primary }}>{doctor.specialty}</Text>
          </View>
          <Text style={{ ...FONTS.h4, color: COLORS.primary }}>฿{doctor.fee}</Text>
        </View>
      </Card>

      {/* Consultation Type */}
      <Text style={styles.sectionTitle}>Consultation Type</Text>
      <View style={styles.typeRow}>
        {[
          { key: 'video', label: 'Video Call', desc: 'Face-to-face online', icon: 'videocam-outline' },
          { key: 'chat', label: 'Chat', desc: 'Text consultation', icon: 'chatbubble-outline' },
        ].map((type) => (
          <TouchableOpacity
            key={type.key}
            style={[styles.typeCard, consultationType === type.key && styles.typeCardActive]}
            onPress={() => setConsultationType(type.key)}
          >
            <Ionicons name={type.icon} size={22} color={consultationType === type.key ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.typeLabel, consultationType === type.key && { color: COLORS.primary }]}>
              {type.label}
            </Text>
            <Text style={styles.typeDesc}>{type.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Selection */}
      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
        {DATES.map((d) => (
          <TouchableOpacity
            key={d.full}
            style={[styles.dateCard, selectedDate === d.full && styles.dateCardActive]}
            onPress={() => setSelectedDate(d.full)}
          >
            <Text style={[styles.dateDay, selectedDate === d.full && { color: COLORS.textInverse }]}>{d.day}</Text>
            <Text style={[styles.dateNum, selectedDate === d.full && { color: COLORS.textInverse }]}>{d.date}</Text>
            <Text style={[styles.dateMonth, selectedDate === d.full && { color: COLORS.textInverse }]}>{d.month}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time Slots */}
      <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Available Slots</Text>
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => (
          <TouchableOpacity
            key={slot.time}
            style={[
              styles.slotBtn,
              !slot.available && styles.slotUnavailable,
              selectedTime === slot.time && styles.slotActive,
            ]}
            disabled={!slot.available}
            onPress={() => setSelectedTime(slot.time)}
          >
            <Text style={[
              styles.slotText,
              !slot.available && { color: COLORS.textMuted },
              selectedTime === slot.time && { color: COLORS.textInverse },
            ]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Symptoms */}
      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl }}>
        <Input
          label="Describe Your Symptoms (Optional)"
          placeholder="Tell the doctor about your symptoms..."
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Summary & Book */}
      <Card style={styles.summary}>
        <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Booking Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Doctor</Text>
          <Text style={styles.summaryValue}>{doctor.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Date</Text>
          <Text style={styles.summaryValue}>
            {selectedDateObj ? `${selectedDateObj.day}, ${selectedDateObj.date} ${selectedDateObj.month}` : '—'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time</Text>
          <Text style={styles.summaryValue}>{selectedTime || 'Not selected'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Type</Text>
          <Text style={styles.summaryValue}>{consultationType === 'video' ? 'Video Call' : 'Chat'}</Text>
        </View>
        <Divider />
        <View style={styles.summaryRow}>
          <Text style={{ ...FONTS.bodyBold, color: COLORS.text }}>Total</Text>
          <Text style={{ ...FONTS.h3, color: COLORS.primary }}>฿{doctor.fee}</Text>
        </View>

        <Button
          title="Confirm & Pay"
          onPress={handleBooking}
          loading={loading}
          style={{ marginTop: SPACING.lg }}
        />
      </Card>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  doctorCard: { marginHorizontal: SPACING.xl, marginTop: SPACING.md },
  sectionTitle: {
    ...FONTS.h4,
    color: COLORS.text,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  typeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  typeCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  typeLabel: { ...FONTS.bodyBold, color: COLORS.text, marginTop: 8 },
  typeDesc: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 4 },
  dateCard: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 64,
  },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateDay: { ...FONTS.small, color: COLORS.textSecondary },
  dateNum: { ...FONTS.h3, color: COLORS.text, marginVertical: 2 },
  dateMonth: { ...FONTS.small, color: COLORS.textSecondary },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  slotBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  slotUnavailable: { opacity: 0.3 },
  slotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { ...FONTS.captionBold, color: COLORS.text },
  summary: { marginHorizontal: SPACING.xl, marginTop: SPACING.xl },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  summaryLabel: { ...FONTS.body, color: COLORS.textSecondary },
  summaryValue: { ...FONTS.bodyBold, color: COLORS.text },
});
