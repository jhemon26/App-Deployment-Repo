import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Button, Card, Badge } from '../../components/UIComponents';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const ROLE_PREVIEW = [
  { label: 'Admin', emoji: '🛡️', color: COLORS.admin },
  { label: 'Doctor', emoji: '👨‍⚕️', color: COLORS.doctor },
  { label: 'Pharmacy', emoji: '💊', color: COLORS.pharmacy },
  { label: 'Patient', emoji: '🧑‍🦱', color: COLORS.general },
];

const FEATURE_HIGHLIGHTS = [
  'JWT auth + role-based access',
  'Bookings, orders, chat, video consultation',
  'Payments, prescriptions, and history',
  'Responsive web + mobile experience',
];

export default function LandingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const compact = width < 720;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.auraTop} />
      <View style={styles.auraSide} />

      <View style={[styles.hero, compact && { flexDirection: 'column' }]}>
        <View style={{ flex: 1 }}>
          <Badge text="I Doc App" color={COLORS.primary} size="sm" />
          <Text style={styles.title}>Modern healthcare for every role.</Text>
          <Text style={styles.subtitle}>
            One platform for appointments, prescriptions, medicine ordering, chat, video consultations, payments, and admin control.
          </Text>

          <View style={styles.actions}>
            <Button title="Login" onPress={() => navigation.navigate('Auth', { screen: 'Login' })} style={styles.primaryBtn} />
            <Button title="Create Account" variant="outline" color={COLORS.primary} onPress={() => navigation.navigate('Auth', { screen: 'Register' })} style={styles.secondaryBtn} />
          </View>

          <View style={styles.featureList}>
            {FEATURE_HIGHLIGHTS.map((item) => (
              <View key={item} style={styles.featureRow}>
                <Text style={{ color: COLORS.primary, marginRight: 8 }}>●</Text>
                <Text style={{ ...FONTS.body, color: COLORS.textSecondary }}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <Card style={styles.previewCard}>
          <Text style={{ ...FONTS.h4, color: COLORS.text, marginBottom: SPACING.md }}>Role previews</Text>
          <View style={styles.roleGrid}>
            {ROLE_PREVIEW.map((role) => (
              <View key={role.label} style={[styles.roleChip, { borderColor: role.color }] }>
                <Text style={{ fontSize: 24 }}>{role.emoji}</Text>
                <Text style={{ ...FONTS.captionBold, color: COLORS.text, marginTop: 6 }}>{role.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: SPACING.lg }}>
            <Text style={{ ...FONTS.caption, color: COLORS.textMuted }}>Fast access areas</Text>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 4 }}>Auth → Role dashboard → Detail pages → Payment → Chat/Video</Text>
          </View>
        </Card>
      </View>

      <View style={styles.bottomStats}>
        {[
          { label: 'Secure', value: 'JWT + RBAC' },
          { label: 'Realtime', value: 'WebSockets' },
          { label: 'Payments', value: 'Stripe' },
          { label: 'Video', value: 'Agora' },
        ].map((item) => (
          <Card key={item.label} style={styles.statCard}>
            <Text style={{ ...FONTS.caption, color: COLORS.textMuted }}>{item.label}</Text>
            <Text style={{ ...FONTS.bodyBold, color: COLORS.text, marginTop: 6 }}>{item.value}</Text>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxxxl, overflow: 'hidden' },
  auraTop: {
    position: 'absolute',
    top: -160,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: COLORS.primaryLight,
  },
  auraSide: {
    position: 'absolute',
    bottom: 60,
    left: -140,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.accentLight,
  },
  hero: {
    flexDirection: 'row',
    gap: SPACING.xl,
    alignItems: 'stretch',
    marginTop: 20,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.text,
    marginTop: SPACING.md,
    maxWidth: 560,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    maxWidth: 560,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  primaryBtn: { minWidth: 140 },
  secondaryBtn: { minWidth: 160 },
  featureList: { marginTop: SPACING.xl, gap: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  previewCard: {
    flex: 1,
    minWidth: 290,
    padding: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    ...SHADOWS.glow(COLORS.primary),
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  roleChip: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgElevated,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  bottomStats: {
    marginTop: SPACING.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  statCard: {
    minWidth: 160,
    flexGrow: 1,
    padding: SPACING.lg,
  },
});
