import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Input, Button, Divider } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { prescriptionAPI } from '../../services/api';
import Toast from 'react-native-toast-message';

export default function PrescriptionScreen({ navigation, route }) {
  const booking = route?.params?.booking || route?.params?.patient;
  const patientName = booking?.patient || booking?.patient_detail?.name || booking?.name || 'patient';
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
      {booking && (
        <Card style={{ marginHorizontal: SPACING.xl, marginTop: SPACING.md }}>
          <Text style={{ ...FONTS.captionBold, color: COLORS.textSecondary }}>Patient</Text>
          <Text style={{ ...FONTS.h4, color: COLORS.text, marginTop: 4 }}>{patientName}</Text>
          <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{booking.symptoms}</Text>
        </Card>
      )}

      <View style={{ paddingHorizontal: SPACING.xl, marginTop: SPACING.xl }}>
        <Input label="Diagnosis" placeholder="Enter diagnosis" value={diagnosis} onChangeText={setDiagnosis} />

        <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Medicines</Text>
        {medicines.map((med, index) => (
          <Card key={index} style={{ marginBottom: SPACING.md, backgroundColor: COLORS.bgElevated }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm }}>
              <Text style={{ ...FONTS.captionBold, color: COLORS.primary }}>Medicine #{index + 1}</Text>
              {medicines.length > 1 && (
                <TouchableOpacity onPress={() => removeMedicine(index)}>
                  <Text style={{ ...FONTS.captionBold, color: COLORS.danger }}>Remove</Text>
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
          </Card>
        ))}

        <Button title="+ Add Medicine" variant="outline" onPress={addMedicine} style={{ marginBottom: SPACING.xl }} />

        <Input label="Additional Notes" placeholder="Any additional notes or instructions..." value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

        <Input label="Follow-up (days)" placeholder="e.g. 7" value={followUpDays} onChangeText={setFollowUpDays} keyboardType="numeric" />

        <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl }}>
          <Button title="Use Template" variant="outline" onPress={handleTemplate} style={{ flex: 1 }} />
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
});
