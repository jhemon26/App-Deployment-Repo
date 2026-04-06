import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button, Card, Chip, Input } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { requestAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

const DATES = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return {
    full: date.toISOString().split('T')[0],
    day: date.toLocaleDateString('en', { weekday: 'short' }),
    date: date.getDate(),
    month: date.toLocaleDateString('en', { month: 'short' }),
    isToday: i === 0,
  };
});

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology',
  'Psychiatry', 'Orthopedics', 'Neurology', 'Gynecology', 'Ophthalmology', 'ENT',
];

const URGENCY_LEVELS = [
  { key: 'low', label: 'Low', icon: 'checkmark-circle-outline', color: COLORS.success },
  { key: 'medium', label: 'Medium', icon: 'alert-circle-outline', color: COLORS.warning },
  { key: 'high', label: 'High', icon: 'warning-outline', color: COLORS.danger },
];

const TIME_RANGES = [
  { key: 'morning', label: 'Morning', sub: '6AM – 12PM', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Afternoon', sub: '12PM – 5PM', icon: 'partly-sunny-outline' },
  { key: 'evening', label: 'Evening', sub: '5PM – 9PM', icon: 'moon-outline' },
];

export default function PostRequestScreen({ navigation, route }) {
  const [specialty, setSpecialty] = useState(route?.params?.specialty || '');
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState(route?.params?.urgency || 'medium');
  const [preferredDate, setPreferredDate] = useState(DATES[0].full);
  const [timeRange, setTimeRange] = useState('morning');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!specialty) {
      Toast.show({ type: 'error', text1: 'Select a specialty' });
      return;
    }
    if (!symptoms.trim()) {
      Toast.show({ type: 'error', text1: 'Describe your symptoms' });
      return;
    }
    setLoading(true);
    try {
      await requestAPI.create({
        specialty,
        symptoms: symptoms.trim(),
        urgency,
        preferred_date: preferredDate,
        preferred_time_range: timeRange,
        notes: notes.trim() || undefined,
      });
      Toast.show({ type: 'success', text1: 'Request Posted!', text2: 'Doctors will be notified of your request' });
      navigation.goBack();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not post request', text2: error.response?.data?.detail || 'Please try again' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Post a Doctor Request</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
          Tell doctors what you need — they'll reach out to you
        </Text>
      </View>

      {/* Specialty */}
      <Text style={styles.sectionTitle}>Specialty Needed</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl, gap: SPACING.sm }}>
        {SPECIALTIES.map((s) => (
          <Chip key={s} label={s} active={specialty === s} onPress={() => setSpecialty(s)} />
        ))}
      </ScrollView>

      {/* Symptoms */}
      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl }}>
        <Input
          label="Describe Your Symptoms *"
          placeholder="e.g. chest pain for 2 days, shortness of breath..."
          value={symptoms}
          onChangeText={setSymptoms}
          multiline
          numberOfLines={4}
        />
      </View>

      {/* Urgency */}
      <Text style={styles.sectionTitle}>Urgency Level</Text>
      <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm }}>
        {URGENCY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.key}
            style={[
              styles.urgencyCard,
              urgency === level.key && { borderColor: level.color, backgroundColor: level.color + '15' },
            ]}
            onPress={() => setUrgency(level.key)}
          >
            <Ionicons name={level.icon} size={20} color={urgency === level.key ? level.color : COLORS.textSecondary} />
            <Text style={[styles.urgencyLabel, urgency === level.key && { color: level.color }]}>
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preferred Date */}
      <Text style={styles.sectionTitle}>Preferred Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
        {DATES.map((d) => (
          <TouchableOpacity
            key={d.full}
            style={[styles.dateCard, preferredDate === d.full && styles.dateCardActive]}
            onPress={() => setPreferredDate(d.full)}
          >
            <Text style={[styles.dateDayText, preferredDate === d.full && { color: COLORS.textInverse }]}>
              {d.isToday ? 'Today' : d.day}
            </Text>
            <Text style={[styles.dateNumText, preferredDate === d.full && { color: COLORS.textInverse }]}>{d.date}</Text>
            <Text style={[styles.dateMonthText, preferredDate === d.full && { color: COLORS.textInverse }]}>{d.month}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Time of Day */}
      <Text style={styles.sectionTitle}>Preferred Time</Text>
      <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.xl, gap: SPACING.sm }}>
        {TIME_RANGES.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.timeCard, timeRange === t.key && styles.timeCardActive]}
            onPress={() => setTimeRange(t.key)}
          >
            <Ionicons name={t.icon} size={20} color={timeRange === t.key ? COLORS.primary : COLORS.textSecondary} />
            <Text style={[styles.timeLabel, timeRange === t.key && { color: COLORS.primary }]}>{t.label}</Text>
            <Text style={styles.timeSub}>{t.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Additional Notes */}
      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl }}>
        <Input
          label="Additional Notes (optional)"
          placeholder="Any other details for the doctor..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Info card */}
      <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md, backgroundColor: COLORS.primary + '10', borderColor: COLORS.primary + '30', borderWidth: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} style={{ marginRight: SPACING.sm, marginTop: 2 }} />
          <Text style={{ ...FONTS.caption, color: COLORS.primary, flex: 1 }}>
            Your request will be visible to available doctors. They can accept and contact you through the app.
          </Text>
        </View>
      </Card>

      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl, marginBottom: 40 }}>
        <Button title="Post Request" onPress={handlePost} loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: 60, paddingBottom: SPACING.lg },
  sectionTitle: { ...FONTS.h4, color: COLORS.text, paddingHorizontal: SPACING.xl, marginTop: SPACING.xl, marginBottom: SPACING.md },
  urgencyCard: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard,
    borderWidth: 2, borderColor: COLORS.border,
  },
  urgencyLabel: { ...FONTS.captionBold, color: COLORS.textSecondary, marginTop: 4 },
  dateCard: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard,
    marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, minWidth: 60,
  },
  dateCardActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dateDayText: { ...FONTS.small, color: COLORS.textSecondary, fontSize: 10 },
  dateNumText: { ...FONTS.h4, color: COLORS.text, marginVertical: 2 },
  dateMonthText: { ...FONTS.small, color: COLORS.textSecondary, fontSize: 10 },
  timeCard: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg, backgroundColor: COLORS.bgCard,
    borderWidth: 2, borderColor: COLORS.border,
  },
  timeCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  timeLabel: { ...FONTS.captionBold, color: COLORS.textSecondary, marginTop: 4 },
  timeSub: { ...FONTS.small, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
});
