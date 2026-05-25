import React from 'react';
import { Text as RNText, TextProps } from 'react-native';

import { Typography, TextVariant, C } from '@/src/theme';

interface AppTextProps extends TextProps {
  variant?: TextVariant; // h1, h2, body, caption...
  color?: string; // Cho phép truyền màu custom nếu muốn (mặc định lấy màu text)
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const AppText = ({
  variant = 'body',
  color = C.text,
  align = 'left',
  style,
  children,
  ...props
}: AppTextProps) => {
  return (
    <RNText
      style={[
        Typography.variants[variant], // Ăn theo font size, weight, line height
        { color, textAlign: align },
        style, // Ghi đè style từ ngoài vào
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
