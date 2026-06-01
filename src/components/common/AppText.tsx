// src/components/common/AppText.tsx
import React from 'react';
import { Text as RNText, StyleProp, TextProps, TextStyle } from 'react-native';

import { C, TextVariant, Typography } from '@/src/theme';

interface AppTextProps extends TextProps {
  variant?: TextVariant | 'lg'; // Thêm 'lg'
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  fontFamily?: 'regular' | 'medium' | 'bold' | string;
  weight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const AppText = ({
  variant = 'body',
  color = C.text,
  align = 'left',
  fontFamily,
  weight,
  numberOfLines,
  ellipsizeMode = 'tail',
  style,
  children,
  ...props
}: AppTextProps) => {
  // Xử lý variant 'lg' đặc biệt
  const getVariantStyle = () => {
    if (variant === 'lg') {
      return { fontSize: 18, lineHeight: 24 };
    }
    return Typography.variants[variant as TextVariant] || Typography.variants.body;
  };

  // Xử lý fontFamily dựa trên weight
  const getFontFamily = () => {
    if (fontFamily) return fontFamily;
    
    switch (weight) {
      case 'bold':
      case '700':
        return 'System-Bold';
      case '600':
        return 'System-Semibold';
      case '500':
        return 'System-Medium';
      default:
        return undefined;
    }
  };

  return (
    <RNText
      style={[
        getVariantStyle(),
        { color, textAlign: align },
        weight && { fontWeight: weight },
        getFontFamily() && { fontFamily: getFontFamily() },
        style,
      ]}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Helper components để dùng nhanh
export const AppHeading = (props: Omit<AppTextProps, 'variant'>) => (
  <AppText variant="h3" weight="700" {...props} />
);

export const AppTitle = (props: Omit<AppTextProps, 'variant'>) => (
  <AppText variant="h4" weight="600" {...props} />
);

export const AppBody = (props: Omit<AppTextProps, 'variant'>) => (
  <AppText variant="body" {...props} />
);

export const AppCaption = (props: Omit<AppTextProps, 'variant'>) => (
  <AppText variant="caption" color={C.textSub} {...props} />
);

export const AppLargeText = (props: Omit<AppTextProps, 'variant'>) => (
  <AppText variant="lg" weight="500" {...props} />
);
