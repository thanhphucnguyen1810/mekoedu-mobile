export const Colors = {
  primary: {
    25: '#FFF5F5',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    450: '#F55B5B',
    500: '#EF4444', // main
    550: '#E53232',
    600: '#DC2626',
    650: '#D11F1F',
    700: '#B91C1C',
    750: '#A81818',
    800: '#991B1B',
    850: '#881717',
    900: '#7F1D1D',
    950: '#6B1111',
  },

  // Secondary
  secondary: {
    50: '#FDF2F2',
    100: '#FDE8E8',
    200: '#FBD5D5',
    300: '#F8B4B4',
    400: '#F48B8B',
    500: '#E53E3E',
    600: '#C53030',
    700: '#9B2C2C',
    800: '#742A2A',
    900: '#522222',
  },

  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  brand: {
    25: '#F4FAF7',
    50: '#E8F5F1',
    100: '#C8E6D9',
    200: '#A5D6C0',
    300: '#81C7A8',
    400: '#66BB9A',
    500: '#1D9E75',
    600: '#0F6E56',
    700: '#0B5E47',
    800: '#094D3A',
    900: '#073B2C',
  },

  // Semantic color
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Neutral
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#0F172A',
    1000: '#000000',
  },

  // Background variants
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6',
    inverse: '#1F2937',
  },
} as const;

export type ColorScheme = typeof Colors;

// ==================== FLAT ALIAS (C) ====================
export const C = {
  bg: Colors.background.primary,
  bgSoft: Colors.background.secondary,
  text: Colors.neutral[900],
  textSub: Colors.neutral[500],
  border: Colors.neutral[200],
  primary: Colors.primary[500],
  primaryLight: Colors.primary[100],
  success: Colors.success,
  error: Colors.error,
  warning: Colors.warning,
  info: Colors.info,
} as const;

