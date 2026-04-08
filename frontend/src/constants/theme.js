// ─────────────────────────────────────────────
//  Design System - QuanLyChiTieu
//  Light theme by default (khác Money Lover)
//  Accent: Indigo #6366F1
// ─────────────────────────────────────────────

const LIGHT_COLORS = {
  // Brand
  primary: '#6366F1',         // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',
  primaryBg: '#EEF2FF',       // Indigo tint

  // Semantic
  income: '#10B981',          // Emerald
  incomeBg: '#D1FAE5',
  expense: '#EF4444',         // Rose
  expenseBg: '#FEE2E2',
  loan: '#F59E0B',            // Amber
  loanBg: '#FEF3C7',

  // Surfaces
  background: '#F5F6FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#F9FAFB',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textInverse: '#FFFFFF',

  // UI
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F0F0F5',

  // Status
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Misc
  white: '#FFFFFF',
  black: '#111827',
  gray: '#9CA3AF',
  overlay: 'rgba(17,24,39,0.5)',

  // Category badge colors
  cat1: '#6366F1', cat2: '#EC4899', cat3: '#F59E0B',
  cat4: '#10B981', cat5: '#3B82F6', cat6: '#8B5CF6',
};

const DARK_COLORS = {
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#6366F1',
  primaryBg: '#312E81',

  income: '#34D399',
  incomeBg: '#064E3B',
  expense: '#F87171',
  expenseBg: '#7F1D1D',
  loan: '#FCD34D',
  loanBg: '#78350F',

  background: '#0F172A',
  surface: '#1E293B',
  card: '#1E293B',
  cardAlt: '#162032',

  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textLight: '#64748B',
  textInverse: '#111827',

  border: '#334155',
  borderLight: '#1E293B',
  divider: '#1E293B',

  error: '#F87171',
  success: '#34D399',
  warning: '#FCD34D',
  info: '#60A5FA',

  white: '#FFFFFF',
  black: '#000000',
  gray: '#64748B',
  overlay: 'rgba(0,0,0,0.65)',

  cat1: '#818CF8', cat2: '#F472B6', cat3: '#FCD34D',
  cat4: '#34D399', cat5: '#60A5FA', cat6: '#A78BFA',
};

export const getColors = (isDark) => isDark ? DARK_COLORS : LIGHT_COLORS;

// Default = Light theme
export const COLORS = LIGHT_COLORS;

export const FONTS = {
  regular: { fontSize: 14, color: COLORS.text },
  medium: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  bold: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  header: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  small: { fontSize: 12, color: COLORS.textSecondary },
  tiny: { fontSize: 11, color: COLORS.textLight },
  amount: { fontSize: 18, fontWeight: '700' },
  amountLg: { fontSize: 28, fontWeight: '800' },
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  radius: 16,
  radiusSm: 10,
  radiusLg: 24,
  radiusXs: 6,
};

export const SHADOWS = {
  none: {},
  xs: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Wallet type colors (unique per type)
export const WALLET_COLORS = {
  CASH: '#10B981',
  BANK_ACCOUNT: '#3B82F6',
  CREDIT_CARD: '#8B5CF6',
  E_WALLET: '#F59E0B',
};
