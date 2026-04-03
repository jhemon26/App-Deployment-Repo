import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from './theme';

export const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={[styles.container, { borderLeftColor: COLORS.success }]}>
      <Text style={styles.title}>{text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={[styles.container, { borderLeftColor: COLORS.danger }]}>
      <Text style={styles.title}>{text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={[styles.container, { borderLeftColor: COLORS.info }]}>
      <Text style={styles.title}>{text1}</Text>
      {text2 && <Text style={styles.message}>{text2}</Text>}
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: '90%',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  title: {
    ...FONTS.bodyBold,
    color: COLORS.text,
  },
  message: {
    ...FONTS.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
