import { C, Radius, Spacing, Typography } from '@/src/theme';
import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

type AppChipProps = React.ComponentProps<typeof Chip> & {
  label: string;
  variant?: 'flat' | 'outlined';
};

export const AppChip = ({ label, variant = 'flat', style, ...props }: AppChipProps) => {
  return (
    <Chip
      mode={variant}
      style={[styles.chip, variant === 'outlined' && styles.outline, style]}
      textStyle={styles.text}
      selectedColor={C.primary}
      theme={{ roundness: Radius.full / 4 }}
      {...props}
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: C.primaryLight,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: C.primary,
  },
  text: {
    ...Typography.variants.caption,
    color: C.primary,
    fontWeight: '600',
  },
});
