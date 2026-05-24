import { C } from '@/src/theme';
import React from 'react';
import { Avatar as PaperAvatar } from 'react-native-paper';

interface AppAvatarProps {
  type?: 'image' | 'text' | 'icon';
  source?: any;     // Link ảnh hoặc require('...')
  label?: string;   // Tên viết tắt, VD: "TN"
  icon?: string;    // Tên icon material
  size?: number;
  backgroundColor?: string;
  color?: string;
}

export const AppAvatar = ({
  type = 'text',
  source,
  label = '?',
  icon = 'account',
  size = 48,
  backgroundColor = C.primaryLight,
  color = C.primary,                
}: AppAvatarProps) => {
  if (type === 'image' && source) {
    return <PaperAvatar.Image size={size} source={source} />;
  }

  if (type === 'icon') {
    return (
      <PaperAvatar.Icon
        size={size}
        icon={icon}
        style={{ backgroundColor }}
        color={color}
      />
    );
  }

  return (
    <PaperAvatar.Text
      size={size}
      label={label}
      style={{ backgroundColor }}
      color={color}
    />
  );
};
