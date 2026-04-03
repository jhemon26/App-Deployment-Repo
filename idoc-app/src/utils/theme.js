import { Platform } from 'react-native';

const FONT_FAMILY = Platform.select({
  ios: 'SF Pro Text',
  android: 'sans-serif',
  default: 'system-ui',
});

// ─── Color Palette ───
export const COLORS = {
  // Primary
  primary: '#64B5F6',
  primaryDark: '#42A5F5',
  primaryLight: '#64B5F628',

  // Accent
  accent: '#26C6DA',
  accentLight: '#26C6DA2B',

  // Status
  success: '#66BB6A',
  warning: '#FFCA28',
  danger: '#EF5350',
  info: '#29B6F6',

  // Role Colors
  admin: '#5C6BC0',
  doctor: '#42A5F5',
  pharmacy: '#26C6DA',
  general: '#90CAF9',

  // Neutrals (Material Cool Dark)
  bg: '#0F172A',
  bgCard: '#172033',
  bgElevated: '#1E293B',
  bgInput: '#243347',
  border: '#334155',
  borderLight: '#47556966',

  // Text
  text: '#E2E8F0',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textInverse: '#0B1220',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  overlay: '#020617B3',
  transparent: 'transparent',
};

// ─── Typography ───
export const FONTS = {
  h1: { fontFamily: FONT_FAMILY, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontFamily: FONT_FAMILY, fontSize: 24, fontWeight: '700', letterSpacing: -0.25 },
  h3: { fontFamily: FONT_FAMILY, fontSize: 20, fontWeight: '700' },
  h4: { fontFamily: FONT_FAMILY, fontSize: 17, fontWeight: '600' },
  body: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyBold: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '600' },
  caption: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '400' },
  captionBold: { fontFamily: FONT_FAMILY, fontSize: 13, fontWeight: '600' },
  small: { fontFamily: FONT_FAMILY, fontSize: 11, fontWeight: '500' },
  button: { fontFamily: FONT_FAMILY, fontSize: 15, fontWeight: '700', letterSpacing: 0.25 },
};

// ─── Spacing ───
export const SPACING = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  xxxxl: 40,
};

// ─── Border Radius ───
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

// ─── Shadows ───
export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  }),
};

// ─── Role Config ───
export const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: COLORS.admin,
    icon: 'shield-checkmark',
    description: 'System Administrator',
  },
  doctor: {
    label: 'Doctor',
    color: COLORS.doctor,
    icon: 'medical',
    description: 'Medical Professional',
  },
  pharmacy: {
    label: 'Pharmacy',
    color: COLORS.pharmacy,
    icon: 'medkit',
    description: 'Pharmacy Partner',
  },
  general: {
    label: 'Patient',
    color: COLORS.general,
    icon: 'person',
    description: 'General User',
  },
};
