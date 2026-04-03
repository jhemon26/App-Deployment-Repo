import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, Image, Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── BUTTON ───
export const Button = ({
  title, onPress, variant = 'primary', size = 'md', loading = false,
  disabled = false, icon, color, style, textStyle, fullWidth = true,
}) => {
  const variants = {
    primary: { bg: color || COLORS.primary, text: COLORS.white },
    secondary: { bg: COLORS.bgElevated, text: COLORS.text, border: COLORS.border },
    outline: { bg: 'transparent', text: color || COLORS.primary, border: color || COLORS.primary },
    danger: { bg: COLORS.danger, text: COLORS.white },
    ghost: { bg: 'transparent', text: color || COLORS.primary },
  };

  const sizes = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 13 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 17 },
  };

  const v = variants[variant];
  const s = sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        {
          backgroundColor: v.bg,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: RADIUS.md,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border || 'transparent',
        },
        (variant === 'primary' || variant === 'danger') && SHADOWS.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[{ color: v.text, fontWeight: '700', fontSize: s.fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── TEXT INPUT ───
export const Input = ({
  label, placeholder, value, onChangeText, secureTextEntry = false,
  keyboardType = 'default', error, multiline = false, numberOfLines = 1,
  icon, rightIcon, style, inputStyle, editable = true, autoCapitalize = 'none',
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[{ marginBottom: SPACING.lg }, style]}>
      {label && (
        <Text style={styles.inputLabel}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          focused && styles.inputFocused,
          error && styles.inputError,
          multiline && { height: numberOfLines * 40, alignItems: 'flex-start' },
        ]}
      >
        {icon && <View style={{ marginRight: SPACING.sm }}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            multiline && { textAlignVertical: 'top', paddingTop: SPACING.md },
            inputStyle,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
        {rightIcon && <View style={{ marginLeft: SPACING.sm }}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ─── CARD ───
export const Card = ({ children, style, onPress, padding = SPACING.lg }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={[styles.card, { padding }, style]}
    >
      {children}
    </Wrapper>
  );
};

// ─── AVATAR ───
export const Avatar = ({ name, uri, size = 48, color = COLORS.primary, style }) => {
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.bgElevated },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + '25',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: color + '40',
        },
        style,
      ]}
    >
      <Text style={{ color, fontSize: size * 0.35, fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
};

// ─── BADGE ───
export const Badge = ({ text, color = COLORS.primary, size = 'md', style }) => {
  const sizes = {
    sm: { px: 6, py: 2, fontSize: 10 },
    md: { px: 10, py: 4, fontSize: 12 },
    lg: { px: 14, py: 6, fontSize: 14 },
  };
  const s = sizes[size];

  return (
    <View
      style={[
        {
          backgroundColor: color + '20',
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          borderRadius: RADIUS.full,
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: color + '30',
        },
        style,
      ]}
    >
      <Text style={{ color, fontSize: s.fontSize, fontWeight: '600' }}>{text}</Text>
    </View>
  );
};

// ─── STAT CARD ───
export const StatCard = ({ label, value, color = COLORS.primary, icon, trend, style }) => (
  <Card style={[{ flex: 1 }, style]}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <Text style={{ ...FONTS.caption, color: COLORS.textSecondary }}>{label}</Text>
        <Text style={{ ...FONTS.h2, color: COLORS.text, marginTop: 4 }}>{value}</Text>
        {trend && (
          <Text style={{ ...FONTS.small, color: trend > 0 ? COLORS.success : COLORS.danger, marginTop: 4 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </Text>
        )}
      </View>
      {icon && (
        <View style={{
          width: 40, height: 40, borderRadius: 12,
          backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </View>
      )}
    </View>
  </Card>
);

// ─── EMPTY STATE ───
export const EmptyState = ({ title, message, icon, action }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxxl }}>
    {icon && <View style={{ marginBottom: SPACING.lg }}>{icon}</View>}
    <Text style={{ ...FONTS.h3, color: COLORS.text, textAlign: 'center' }}>{title}</Text>
    <Text style={{ ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.sm }}>
      {message}
    </Text>
    {action && <View style={{ marginTop: SPACING.xl, width: '60%' }}>{action}</View>}
  </View>
);

// ─── SECTION HEADER ───
export const SectionHeader = ({ title, actionText, onAction, style }) => (
  <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, paddingHorizontal: SPACING.xl }, style]}>
    <Text style={{ ...FONTS.h4, color: COLORS.text }}>{title}</Text>
    {actionText && (
      <TouchableOpacity onPress={onAction}>
        <Text style={{ ...FONTS.captionBold, color: COLORS.primary }}>{actionText}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── DIVIDER ───
export const Divider = ({ style }) => (
  <View style={[{ height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg }, style]} />
);

// ─── LOADING SCREEN ───
export const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={{ ...FONTS.body, color: COLORS.textSecondary, marginTop: SPACING.lg }}>{message}</Text>
  </View>
);

// ─── SEARCH BAR ───
export const SearchBar = ({ value, onChangeText, placeholder = 'Search...', style }) => (
  <View style={[styles.searchBar, style]}>
    <Ionicons name="search" size={16} color={COLORS.textMuted} style={{ marginRight: 8 }} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textMuted}
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
    />
    {value ? (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Ionicons name="close" size={16} color={COLORS.textMuted} />
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── CHIP / FILTER ───
export const Chip = ({ label, active, onPress, color = COLORS.primary }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: RADIUS.full,
      backgroundColor: active ? color : COLORS.bgElevated,
      borderWidth: 1,
      borderColor: active ? color : COLORS.border,
      marginRight: SPACING.sm,
    }}
  >
    <Text style={{
      ...FONTS.captionBold,
      color: active ? COLORS.textInverse : COLORS.textSecondary,
    }}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Styles ───
const styles = StyleSheet.create({
  inputLabel: {
    ...FONTS.captionBold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 52,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.bgElevated,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
    height: '100%',
  },
  errorText: {
    ...FONTS.small,
    color: COLORS.danger,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    ...FONTS.body,
    color: COLORS.text,
  },
});
