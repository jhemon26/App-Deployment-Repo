import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, ROLE_CONFIG } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const ROLES = ['general', 'doctor', 'pharmacy'];
const ROLE_ICONS = {
  general: 'person-outline',
  doctor: 'medkit-outline',
  pharmacy: 'medical-outline',
};

export default function RegisterScreen({ navigation }) {
  const { register, loading } = useAuth();
  const [step, setStep] = useState(1); // 1: role, 2: info, 3: role-specific
  const [role, setRole] = useState('general');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    // Doctor fields
    specialty: '', experience: '', fee: '', license: '',
    // Pharmacy fields
    pharmacyName: '', pharmacyLicense: '', address: '',
  });

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all required fields' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      Toast.show({ type: 'error', text1: 'Password Mismatch', text2: 'Passwords do not match' });
      return;
    }
    if (form.password.length < 6) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role,
      };

      if (role === 'doctor') {
        payload.specialty = form.specialty;
        payload.experience = form.experience;
        payload.fee = form.fee;
        payload.license_number = form.license;
      }

      if (role === 'pharmacy') {
        payload.pharmacy_name = form.pharmacyName;
        payload.pharmacy_license = form.pharmacyLicense;
        payload.address = form.address;
      }

      const result = await register(payload);
      if (result.needsApproval) {
        Toast.show({ type: 'info', text1: 'Registration Successful', text2: 'Awaiting admin approval. You will be notified once approved.' });
        navigation.navigate('Login');
      } else {
        Toast.show({ type: 'success', text1: 'Welcome to I Doc!' });
      }
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Registration Failed', text2: error.message });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ color: COLORS.text, fontSize: 18 }}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step {step} of {role === 'general' ? 2 : 3}</Text>
        </View>

        {/* Step 1: Role Selection */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>I am a...</Text>
            {ROLES.map((r) => {
              const config = ROLE_CONFIG[r];
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={[
                    styles.roleCard,
                    role === r && { borderColor: config.color, backgroundColor: config.color + '10' },
                  ]}
                >
                  <View style={[styles.roleIcon, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={ROLE_ICONS[r]} size={24} color={config.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.roleName, role === r && { color: config.color }]}>
                      {config.label}
                    </Text>
                    <Text style={styles.roleDesc}>{config.description}</Text>
                  </View>
                  <View style={[styles.radioOuter, role === r && { borderColor: config.color }]}>
                    {role === r && <View style={[styles.radioInner, { backgroundColor: config.color }]} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            <Button
              title="Continue"
              onPress={() => setStep(2)}
              style={{ marginTop: SPACING.xl }}
            />
          </View>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Basic Information</Text>
            <Input label="Full Name" placeholder="Enter your full name" value={form.name} onChangeText={(v) => updateForm('name', v)} autoCapitalize="words" />
            <Input label="Email" placeholder="Enter your email" value={form.email} onChangeText={(v) => updateForm('email', v)} keyboardType="email-address" />
            <Input label="Phone" placeholder="Enter phone number" value={form.phone} onChangeText={(v) => updateForm('phone', v)} keyboardType="phone-pad" />
            <Input label="Password" placeholder="Min 6 characters" value={form.password} onChangeText={(v) => updateForm('password', v)} secureTextEntry />
            <Input label="Confirm Password" placeholder="Re-enter password" value={form.confirmPassword} onChangeText={(v) => updateForm('confirmPassword', v)} secureTextEntry />

            <View style={styles.btnRow}>
              <Button title="Back" onPress={() => setStep(1)} variant="outline" style={{ flex: 1, marginRight: 8 }} />
              <Button
                title={role === 'general' ? 'Sign Up' : 'Continue'}
                onPress={role === 'general' ? handleRegister : () => setStep(3)}
                loading={role === 'general' && loading}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        )}

        {/* Step 3: Role-specific (Doctor/Pharmacy) */}
        {step === 3 && role === 'doctor' && (
          <View>
            <Text style={styles.stepTitle}>Professional Details</Text>
            <Input label="Specialty" placeholder="e.g. General Medicine, Cardiology" value={form.specialty} onChangeText={(v) => updateForm('specialty', v)} />
            <Input label="Experience" placeholder="e.g. 5 years" value={form.experience} onChangeText={(v) => updateForm('experience', v)} />
            <Input label="Consultation Fee (THB)" placeholder="e.g. 500" value={form.fee} onChangeText={(v) => updateForm('fee', v)} keyboardType="numeric" />
            <Input label="Medical License Number" placeholder="Enter license number" value={form.license} onChangeText={(v) => updateForm('license', v)} />

            <View style={styles.btnRow}>
              <Button title="Back" onPress={() => setStep(2)} variant="outline" style={{ flex: 1, marginRight: 8 }} />
              <Button title="Submit" onPress={handleRegister} loading={loading} style={{ flex: 1, marginLeft: 8 }} />
            </View>
            <Text style={styles.noteText}>
              Your registration will be reviewed by an admin before activation.
            </Text>
          </View>
        )}

        {step === 3 && role === 'pharmacy' && (
          <View>
            <Text style={styles.stepTitle}>Pharmacy Details</Text>
            <Input label="Pharmacy Name" placeholder="Enter pharmacy name" value={form.pharmacyName} onChangeText={(v) => updateForm('pharmacyName', v)} />
            <Input label="License Number" placeholder="Enter pharmacy license" value={form.pharmacyLicense} onChangeText={(v) => updateForm('pharmacyLicense', v)} />
            <Input label="Address" placeholder="Full address" value={form.address} onChangeText={(v) => updateForm('address', v)} multiline numberOfLines={3} />

            <View style={styles.btnRow}>
              <Button title="Back" onPress={() => setStep(2)} variant="outline" style={{ flex: 1, marginRight: 8 }} />
              <Button title="Submit" onPress={handleRegister} loading={loading} style={{ flex: 1, marginLeft: 8 }} />
            </View>
            <Text style={styles.noteText}>
              Your pharmacy registration will be reviewed by an admin.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxxl },
  header: { marginTop: 60, marginBottom: SPACING.xxxl },
  backBtn: { marginBottom: SPACING.lg },
  title: { ...FONTS.h1, color: COLORS.text },
  subtitle: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },
  stepTitle: { ...FONTS.h3, color: COLORS.text, marginBottom: SPACING.xl },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg,
  },
  roleName: { ...FONTS.h4, color: COLORS.text },
  roleDesc: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: 2 },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  btnRow: { flexDirection: 'row', marginTop: SPACING.xl },
  noteText: {
    ...FONTS.caption,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});
