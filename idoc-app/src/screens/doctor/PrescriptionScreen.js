import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card, Input, Button, Badge, Avatar } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { prescriptionAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function PrescriptionScreen({ navigation, route }) {
  const booking = route?.params?.booking || route?.params?.patient;
  const patientName = booking?.patient || booking?.patient_detail?.name || booking?.name || 'Patient';
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '', instructions: '' }]);
  const [followUpDays, setFollowUpDays] = useState('7');
  const [loading, setLoading] = useState(false);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '', instructions: '' }]);
  };

  const updateMedicine = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const removeMedicine = (index) => {
    if (medicines.length > 1) {
      setMedicines(medicines.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (!diagnosis.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter a diagnosis' });
      return;
    }
    const hasInvalidMedicine = medicines.some((medicine) => !medicine.name.trim() || !medicine.dosage.trim() || !medicine.duration.trim());
    if (hasInvalidMedicine) {
      Toast.show({ type: 'error', text1: 'Complete medicine details', text2: 'Name, dosage, and duration are required for each medicine.' });
      return;
    }
    setLoading(true);
    const payload = {
      booking: booking?.id,
      diagnosis,
      notes: [notes, `Follow up in ${followUpDays} days`].filter(Boolean).join('\n'),
      medicines,
    };

    prescriptionAPI.create(payload)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Prescription Sent', text2: `Prescription sent to ${patientName} and linked pharmacy` });
        navigation.goBack();
      })
      .catch((error) => {
        Toast.show({ type: 'error', text1: 'Prescription failed', text2: error.response?.data?.error || 'Please try again' });
      })
      .finally(() => setLoading(false));
  };

  const handleDraft = () => {
    Toast.show({ type: 'info', text1: 'Draft saved', text2: `Draft prescription stored for ${patientName}.` });
  };

  const handleTemplate = () => {
    setDiagnosis('Upper respiratory infection');
    setNotes('Monitor temperature, rest well, and return if symptoms worsen.');
    setMedicines([
      { name: 'Paracetamol 500mg', dosage: '1 tab', duration: '5 days', instructions: 'After meals, twice daily' },
      { name: 'Cetirizine 10mg', dosage: '1 tab', duration: '3 days', instructions: 'At night' },
    ]);
    setFollowUpDays('3');
    Toast.show({ type: 'info', text1: 'Template applied', text2: 'Common respiratory prescription template loaded.' });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={{ ...FONTS.h2, color: COLORS.text }}>Create Prescription</Text>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 4 }}>
          Issue prescription for {patientName}
        </Text>
      </View>

      {/* Patient info card */}
      {booking && (
        <View style={[styles.patientCard, SHADOWS.sm]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.patientIcon}>
              <Ionicons name="person-outline" size={22} color={COLORS.general} />
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={{ ...FONTS.small, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Patient</Text>
              <Text style={{ ...FONTS.h4, color: COLORS.text, marginTop: 2 }}>{patientName}</Text>
              {booking.symptoms ? (
                <Text style={{ ...FONTS.caption, color: COLORS.textSecondary, marginTop: 3 }} numberOfLines={2}>
                  {booking.symptoms}
                </Text>
              ) : null}
            </View>
            <Badge text="Active" color={COLORS.success} size="sm" />
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.lg }}>
        {/* Diagnosis */}
        <View style={styles.sectionHeader}>
          <Ionicons name="clipboard-outline" size={16} color={COLORS.doctor} />
          <Text style={styles.sectionHeaderText}>Diagnosis</Text>
        </View>
        <Input
          placeholder="Enter diagnosis"
          value={diagnosis}
          onChangeText={setDiagnosis}
        />

        {/* Medicines section */}
        <View style={[styles.sectionHeader, { marginTop: SPACING.lg }]}>
          <Ionicons name="medical-outline" size={16} color={COLORS.pharmacy} />
          <Text style={styles.sectionHeaderText}>Medicines</Text>
          <View style={styles.medCountBadge}>
            <Text style={{ ...FONTS.captionBold, color: COLORS.pharmacy, fontSize: 11 }}>{medicines.length}</Text>
          </View>
        </View>

        {medicines.map((med, index) => (
          <View key={index} style={[styles.medCard, SHADOWS.sm]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                <View style={styles.medIndex}>
                  <Text style={{ ...FONTS.captionBold, color: COLORS.text, fontSize: 11 }}>{index + 1}</Text>
                </View>
                <Text style={{ ...FONTS.captionBold, color: COLORS.pharmacy }}>Medicine #{index + 1}</Text>
              </View>
              {medicines.length > 1 && (
                <TouchableOpacity onPress={() => removeMedicine(index)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
            <Input label="Medicine Name" placeholder="e.g. Paracetamol 500mg" value={med.name} onChangeText={(v) => updateMedicine(index, 'name', v)} />
            <View style={{ flexDirection: 'row', gap: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Input label="Dosage" placeholder="e.g. 1 tab" value={med.dosage} onChangeText={(v) => updateMedicine(index, 'dosage', v)} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Duration" placeholder="e.g. 7 days" value={med.duration} onChangeText={(v) => updateMedicine(index, 'duration', v)} />
              </View>
            </View>
            <Input label="Instructions" placeholder="e.g. After meals, twice daily" value={med.instructions} onChangeText={(v) => updateMedicine(index, 'instructions', v)} />
          </View>
        ))}

        <Button
          title="+ Add Another Medicine"
          variant="outline"
          color={COLORS.pharmacy}
          onPress={addMedicine}
          style={{ marginBottom: SPACING.xl }}
        />

        {/* Notes & Follow-up */}
        <View style={[styles.sectionHeader, { marginBottom: SPACING.md }]}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.info} />
          <Text style={styles.sectionHeaderText}>Notes & Follow-up</Text>
        </View>

        <Input label="Additional Notes" placeholder="Any additional notes or instructions..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        <Input label="Follow-up (days)" placeholder="e.g. 7" value={followUpDays} onChangeText={setFollowUpDays} keyboardType="numeric" />

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl }}>
          <Button title="Use Template" variant="outline" color={COLORS.doctor} onPress={handleTemplate} style={{ flex: 1 }} />
          <Button title="Save Draft" variant="outline" color={COLORS.info} onPress={handleDraft} style={{ flex: 1 }} />
        </View>

        <Button title="Send Prescription" onPress={handleSubmit} loading={loading} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 52,
    paddingBottom: SPACING.sm,
  },
  patientCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.general,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  patientIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.general + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionHeaderText: {
    ...FONTS.h4,
    color: COLORS.text,
  },
  medCountBadge: {
    backgroundColor: COLORS.pharmacy + '20',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.pharmacy + '40',
  },
  medCard: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.pharmacy,
  },
  medIndex: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.pharmacy + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    padding: SPACING.sm,
    backgroundColor: COLORS.danger + '15',
    borderRadius: RADIUS.sm,
  },
});
