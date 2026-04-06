import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Card, Button } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CONSULTATION_TYPES = [
  { id: 'chat', label: 'Chat Only', icon: 'chatbubble-outline' },
  { id: 'video', label: 'Video Call', icon: 'videocam-outline' },
  { id: 'both', label: 'Both', icon: 'swap-horizontal-outline' },
];

const defaultDay = { enabled: false, start: '09:00', end: '17:00', type: 'both' };

const formatTypeLabel = (type) => {
  if (type === 'chat') return 'Chat';
  if (type === 'video') return 'Video';
  return 'Chat & Video';
};

const getHoursUntilNextOccurrence = (dayName, startTime) => {
  try {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const todayIndex = now.getDay();
    const targetIndex = days.indexOf(dayName);
    if (targetIndex < 0) return Number.POSITIVE_INFINITY;

    const offsetDays = (targetIndex - todayIndex + 7) % 7;
    const [startHour, startMinute] = String(startTime || '00:00').split(':').map(Number);
    const nextStart = new Date(now);
    nextStart.setDate(now.getDate() + offsetDays);
    nextStart.setHours(startHour || 0, startMinute || 0, 0, 0);

    if (offsetDays === 0 && nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 7);
    }

    return (nextStart.getTime() - now.getTime()) / (1000 * 60 * 60);
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

export default function PostAvailabilityScreen() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState({
    Monday: { ...defaultDay },
    Tuesday: { ...defaultDay },
    Wednesday: { ...defaultDay },
    Thursday: { ...defaultDay },
    Friday: { ...defaultDay },
    Saturday: { ...defaultDay },
    Sunday: { ...defaultDay },
  });
  const [editorDay, setEditorDay] = useState(null);
  const [draft, setDraft] = useState(null);

  const loadSchedule = useCallback(async () => {
    try {
      const doctorProfile = user?.doctor_profile || user;
      if (doctorProfile?.availability_hours) {
        setSchedule(doctorProfile.availability_hours);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [loadSchedule])
  );

  const openEditor = (day) => {
    setEditorDay(day);
    setDraft({ ...(schedule[day] || defaultDay) });
  };

  const closeEditor = () => {
    setEditorDay(null);
    setDraft(null);
  };

  const updateDraft = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveDraft = () => {
    if (!draft?.start || !draft?.end) {
      Toast.show({ type: 'error', text1: 'Please fill in both times' });
      return;
    }

    setSchedule((prev) => ({
      ...prev,
      [editorDay]: { ...draft, enabled: true },
    }));
    Toast.show({ type: 'success', text1: `${editorDay} availability prepared` });
    closeEditor();
  };

  const cancelAvailability = (dayName) => {
    const current = schedule[dayName];
    if (!current?.enabled) return;

    const hoursLeft = getHoursUntilNextOccurrence(dayName, current.start);
    if (hoursLeft < 12) {
      Toast.show({
        type: 'error',
        text1: 'Too late to cancel',
        text2: 'Availability cannot be cancelled within 12 hours of the next shift.',
      });
      return;
    }

    setSchedule((prev) => ({
      ...prev,
      [dayName]: { ...prev[dayName], enabled: false },
    }));
    if (editorDay === dayName) closeEditor();
    Toast.show({ type: 'success', text1: 'Availability cancelled' });
  };

  const saveAll = async () => {
    setLoading(true);
    try {
      await updateProfile({ availability_hours: schedule });
      Toast.show({ type: 'success', text1: 'Schedule saved successfully!' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to save schedule' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const savedDays = useMemo(
    () => DAYS.filter((day) => (schedule[day] || {}).enabled),
    [schedule]
  );

  const activeCount = savedDays.length;

  return (
    <ScrollView style={styles.page} showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageContent}>
      <View style={styles.headerBlock}>
        <Text style={styles.pageTitle}>My Availability</Text>
        <Text style={styles.pageSubtitle}>Post weekly hours first, then manage what you have already saved</Text>
      </View>

      <Card style={styles.noticeCard}>
        <View style={styles.noticeRow}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
          <Text style={styles.noticeText}>
            Use the top section to post or edit a day. The lower section shows everything you have saved and lets you edit or cancel it.
          </Text>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Post Availability</Text>
            <Text style={styles.sectionMeta}>Tap a day to edit it</Text>
          </View>
          <View style={styles.countPill}>
            <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
            <Text style={styles.countPillText}>{activeCount} saved</Text>
          </View>
        </View>

        <View style={styles.dayList}>
          {DAYS.map((day) => {
            const dayData = schedule[day] || defaultDay;
            const isOpen = editorDay === day;

            return (
              <TouchableOpacity
                key={day}
                activeOpacity={0.75}
                onPress={() => (isOpen ? closeEditor() : openEditor(day))}
                style={[styles.dayRow, dayData.enabled && styles.dayRowEnabled, isOpen && styles.dayRowOpen]}
              >
                <View style={styles.dayLeft}>
                  <View style={[styles.dayDot, dayData.enabled && styles.dayDotOn]} />
                  <View>
                    <Text style={[styles.dayLabel, dayData.enabled && styles.dayLabelOn]}>{day}</Text>
                    <Text style={styles.daySub}>
                      {dayData.enabled ? `${dayData.start} - ${dayData.end}` : 'Not posted yet'}
                    </Text>
                  </View>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {editorDay && draft && (
          <View style={styles.editorPanel}>
            <View style={styles.editorHeading}>
              <Text style={styles.editorTitle}>{editorDay}</Text>
              <Text style={styles.editorSubtitle}>Set hours and consultation mode</Text>
            </View>

            <View style={styles.timeBlock}>
              <Text style={styles.blockLabel}>Availability Hours</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeFieldGroup}>
                  <Text style={styles.timeLabel}>From</Text>
                  <TextInput
                    placeholder="09:00"
                    placeholderTextColor={COLORS.textMuted}
                    value={draft.start || ''}
                    onChangeText={(text) => updateDraft('start', text)}
                    style={styles.timeInput}
                    maxLength={5}
                  />
                </View>
                <View style={styles.timeDivider}>
                  <Text style={styles.timeDividerText}>to</Text>
                </View>
                <View style={styles.timeFieldGroup}>
                  <Text style={styles.timeLabel}>Until</Text>
                  <TextInput
                    placeholder="17:00"
                    placeholderTextColor={COLORS.textMuted}
                    value={draft.end || ''}
                    onChangeText={(text) => updateDraft('end', text)}
                    style={styles.timeInput}
                    maxLength={5}
                  />
                </View>
              </View>
            </View>

            <View style={styles.typeBlock}>
              <Text style={styles.blockLabel}>Consultation Type</Text>
              <View style={styles.typeRow}>
                {CONSULTATION_TYPES.map((type) => {
                  const selected = draft.type === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      activeOpacity={0.8}
                      onPress={() => updateDraft('type', type.id)}
                      style={[styles.typeCard, selected && styles.typeCardOn]}
                    >
                      <Ionicons name={type.icon} size={15} color={selected ? COLORS.primary : COLORS.textSecondary} />
                      <Text style={[styles.typeText, selected && styles.typeTextOn]}>{type.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.editorActions}>
              <Button title="Cancel" variant="outline" size="sm" onPress={closeEditor} style={styles.actionBtn} />
              <Button title="Save" size="sm" onPress={saveDraft} style={styles.actionBtn} />
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Saved Availability</Text>
            <Text style={styles.sectionMeta}>{activeCount} active day{activeCount === 1 ? '' : 's'}</Text>
          </View>
        </View>

        {savedDays.length ? (
          <View style={styles.savedList}>
            {savedDays.map((dayName) => {
              const item = schedule[dayName];
              const editing = editorDay === dayName;
              return (
                <View key={dayName} style={styles.savedItem}>
                  <View style={styles.savedTopRow}>
                    <View style={styles.savedInfo}>
                      <View style={styles.savedDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.savedDay}>{dayName}</Text>
                        <Text style={styles.savedMeta}>
                          {item.start} - {item.end} · {formatTypeLabel(item.type)}
                        </Text>
                      </View>
                    </View>
                    {editing && <Text style={styles.editingBadge}>Editing</Text>}
                  </View>

                  <View style={styles.savedActions}>
                    <Button title="Edit" size="sm" variant="outline" color={COLORS.primary} onPress={() => openEditor(dayName)} style={styles.savedBtn} />
                    <Button title="Cancel" size="sm" variant="outline" color={COLORS.danger} onPress={() => cancelAvailability(dayName)} style={styles.savedBtn} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptySaved}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No saved availability yet</Text>
            <Text style={styles.emptyText}>Post a day above and it will appear here for editing or cancellation.</Text>
          </View>
        )}
      </Card>

      <Button title={loading ? 'Saving...' : 'Save All Changes'} onPress={saveAll} disabled={loading} style={styles.saveAllBtn} />
      <Text style={styles.footerText}>Your availability is visible to patients when they search for doctors.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.bg },
  pageContent: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xxxl },
  headerBlock: { marginBottom: SPACING.md },
  pageTitle: { ...FONTS.h2, color: COLORS.text },
  pageSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 },
  noticeCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.info + '0E',
    borderColor: COLORS.info + '28',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  noticeText: { ...FONTS.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },
  sectionCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgCard,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  sectionTitle: { ...FONTS.h4, color: COLORS.text },
  sectionMeta: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '12',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countPillText: { ...FONTS.captionBold, color: COLORS.primary, fontSize: 11 },
  dayList: { rowGap: 8 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayRowEnabled: {
    borderColor: COLORS.success + '35',
    backgroundColor: COLORS.success + '08',
  },
  dayRowOpen: {
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '10',
  },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dayDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.textMuted },
  dayDotOn: { backgroundColor: COLORS.success },
  dayLabel: { ...FONTS.bodyBold, color: COLORS.textSecondary },
  dayLabelOn: { color: COLORS.text },
  daySub: { ...FONTS.caption, color: COLORS.textMuted, marginTop: 1 },
  editorPanel: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.bgElevated,
  },
  editorHeading: { marginBottom: SPACING.md },
  editorTitle: { ...FONTS.bodyBold, color: COLORS.text },
  editorSubtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  timeBlock: { marginBottom: SPACING.md },
  blockLabel: {
    ...FONTS.captionBold,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: SPACING.xs,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
  },
  timeFieldGroup: { flex: 1 },
  timeLabel: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: 6, paddingHorizontal: 2 },
  timeInput: {
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    ...FONTS.body,
    textAlign: 'center',
    paddingHorizontal: 10,
    paddingVertical: 0,
  },
  timeDivider: { width: 28, alignItems: 'center', justifyContent: 'center', paddingBottom: 4 },
  timeDividerText: { ...FONTS.captionBold, color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeBlock: { marginBottom: SPACING.md },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeCard: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  typeCardOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '12' },
  typeText: { ...FONTS.small, color: COLORS.textSecondary, textAlign: 'center', fontSize: 11 },
  typeTextOn: { color: COLORS.primary },
  editorActions: { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  actionBtn: { flex: 1, minWidth: 92 },
  savedList: { rowGap: 8 },
  savedItem: {
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgElevated,
  },
  savedTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  savedInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  savedDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.success },
  savedDay: { ...FONTS.bodyBold, color: COLORS.text },
  savedMeta: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  editingBadge: { ...FONTS.captionBold, color: COLORS.primary, fontSize: 11 },
  savedActions: { flexDirection: 'row', gap: 8, marginTop: SPACING.sm },
  savedBtn: { flex: 1 },
  emptySaved: { alignItems: 'center', paddingVertical: SPACING.lg, rowGap: 6 },
  emptyTitle: { ...FONTS.bodyBold, color: COLORS.text },
  emptyText: { ...FONTS.caption, color: COLORS.textSecondary, textAlign: 'center' },
  saveAllBtn: { marginTop: SPACING.sm },
  footerText: { ...FONTS.caption, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.md, lineHeight: 18 },
});
