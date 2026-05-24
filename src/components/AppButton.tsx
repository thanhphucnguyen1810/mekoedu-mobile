import { C, Radius, Spacing, Typography } from '@/src/theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'contained' | 'outlined' | 'text'; // các kiểu nút: nút đặc, nút viền, text
  loading?: boolean;
  disable?: boolean;
  icon?: string   // tên icon từ thư viện MaterialIcon
}

export const AppButton = ({
  title,
  onPress,
  mode = 'contained',
  loading = false,
  disable = false,
  icon,
}: AppButtonProps) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disable}
      icon={icon}
      theme={{
        colors: {
          primary: C.primary,             // màu chủ đạo
          surfaceDisabled: C.border,      // màu nền khi bị khóa
          onSurfaceDisabled: C.textSub,   // Màu chữ khi bị xóa    
        },
        roundness: Radius.md  / 2,
      }}
      style={[
        styles.button,
        mode === 'outlined' && styles.outlinedButton
      ]}
      labelStyle={styles.label}
    >
      {title}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: Spacing.xs,   // k/c trên dưới giữa các nút
    justifyContent: 'center',
    height: 48,                   // h chuẩn cho nút bấm
  },
  outlinedButton: {
    borderColor: C.primary,
    borderWidth: 1,
  },
  label: {
    ...Typography.variants.button   // ăn theo font, size chữ button đã định nghĩa
  }
})
