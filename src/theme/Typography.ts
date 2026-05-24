import { Platform, TextStyle } from 'react-native';

export const Typography = {
  fonts: {
    regular: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    // Fix Android Roboto-Medium issue
    medium: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    semibold: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
    bold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
    extrabold: Platform.select({ ios: 'System', android: 'Roboto-Bold', default: 'System' }),
  },

  sizes: {
    xs: 12, sm: 14, md: 16, lg: 18, xl: 20,
    '2xl': 24, '3xl': 30, '4xl': 36, '5xl': 48,
  },

  lineHeights: {
    none: 1, tight: 1.25, normal: 1.5, relaxed: 1.75,
  },

  variants: {
    h1: {
      fontSize: 36,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
      fontWeight: '700',
      lineHeight: 44,
    } as TextStyle,
    
    h2: {
      fontSize: 30,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
      fontWeight: '700',
      lineHeight: 38,
    } as TextStyle,
    
    h3: {
      fontSize: 24,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '600', // Dùng weight thay vì Roboto-Medium
      lineHeight: 32,
    } as TextStyle,
    
    h4: {
      fontSize: 20,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '600',
      lineHeight: 28,
    } as TextStyle,

    // Vẫn giữ body1, body2 cho code cũ
    body1: {
      fontSize: 16,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '400',
      lineHeight: 24,
    } as TextStyle,
    
    body2: {
      fontSize: 14,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '400',
      lineHeight: 20,
    } as TextStyle,

    // ALIAS MỚI: Đồng bộ với Spacing (md, sm)
    get body() { return this.body1; },
    get bodySmall() { return this.body2; },

    caption: {
      fontSize: 12,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '400',
      lineHeight: 16,
    } as TextStyle,
    
    button: {
      fontSize: 16,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '600',
      lineHeight: 24,
    } as TextStyle,
    
    price: {
      fontSize: 24,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto-Bold' }),
      fontWeight: '700',
      lineHeight: 32,
    } as TextStyle,
    
    overline: {
      fontSize: 10,
      fontFamily: Platform.select({ ios: 'System', android: 'Roboto' }),
      fontWeight: '500',
      lineHeight: 12,
      letterSpacing: 1,
    } as TextStyle,
  },
} as const;

export type TypographyType = typeof Typography;
export type TextVariant = keyof typeof Typography.variants;

export const createTextStyle = (
  variant: TextVariant,
  customStyles?: TextStyle
): TextStyle => ({
  ...Typography.variants[variant],
  ...customStyles,
});
