import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { Button, Card, Input } from '../../components/UIComponents';
import { authAPI } from '../../services/api';
import { COLORS, FONTS, SPACING } from '../../utils/theme';

export default function ChangePasswordScreen({ navigation }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Missing fields', text2: 'Please fill all password fields.' });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Weak password', text2: 'Use at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({ old_password: oldPassword, new_password: newPassword });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Toast.show({ type: 'success', text1: 'Password updated' });
      navigation.goBack();
    } catch (error) {
      const msg = error.response?.data?.detail
        || error.response?.data?.old_password?.[0]
        || error.response?.data?.new_password?.[0]
        || 'Could not update password.';
      Toast.show({ type: 'error', text1: 'Update failed', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Password Management</Text>
        <Text style={styles.subtitle}>Change your login password securely.</Text>
      </View>

      <Card style={styles.card}>
        <Input
          label="Current Password"
          placeholder="Enter current password"
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
        />
        <Input
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <Input
          label="Confirm New Password"
          placeholder="Re-enter new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <View style={styles.tipRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.success} />
          <Text style={styles.tipText}>Use a unique password you do not reuse elsewhere.</Text>
        </View>

        <Button title="Update Password" loading={loading} onPress={handleSubmit} />
      </Card>

      <View style={{ height: SPACING.xxxxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: 22,
    paddingBottom: SPACING.lg,
  },
  title: {
    ...FONTS.h3,
    color: COLORS.text,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  card: {
    marginHorizontal: SPACING.xl,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  tipText: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
