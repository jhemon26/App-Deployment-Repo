import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Button, Input } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter email and password' });
      return;
    }
    try {
      await login(email.trim(), password);
      Toast.show({ type: 'success', text1: 'Welcome back!' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Login Failed', text2: error.message });
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
          <View style={styles.logoBadge}>
            <Ionicons name="medkit-outline" size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>I Doc</Text>
          <Text style={styles.tagline}>Your Health, One Tap Away</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} />

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxxl },
  header: {
    alignItems: 'center',
    marginTop: 72,
    marginBottom: 30,
  },
  logoBadge: {
    width: 66,
    height: 66,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    ...FONTS.h1,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  tagline: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  form: { marginBottom: SPACING.xxxl },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: SPACING.xl, marginTop: -SPACING.sm },
  forgotText: { ...FONTS.captionBold, color: COLORS.primary },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  registerText: { ...FONTS.body, color: COLORS.textSecondary },
  registerLink: { ...FONTS.bodyBold, color: COLORS.primary },
});
