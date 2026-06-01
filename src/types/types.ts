export interface RegisterFormFields {
  familyName: string;
  givenName: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

export interface RegisterFormErrors {
  familyName?: string;
  givenName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export type ThemePresetId = 'ios-clean' | 'warm-education' | 'minimal-white' | 'dark-charcoal';

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  bg: string;          // Page background
  cardBg: string;      // Input field / Card background
  primary: string;     // Red primary hue (e.g. text or key color)
  accent: string;      // Gradient/highlight color
  border: string;      // Border color
  text: string;        // Primary text
  textSub: string;     // Secondary/muted text
  isDark: boolean;
}

