import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Divider as PaperDivider } from 'react-native-paper';

import { C, Spacing } from '@/src/theme';

interface AppDividerProps {
  spacing?: number; // Khoảng cách margin trên dưới
  style?: StyleProp<ViewStyle>; // Thêm style custom
}

export const AppDivider = ({ spacing = Spacing.md, style }: AppDividerProps) => {
  return (
    <PaperDivider 
      style={[styles.divider, { marginVertical: spacing }, style]} 
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: C.border,
    height: 1,
  },
});
