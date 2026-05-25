import React from 'react';
import { StyleSheet } from 'react-native';
import { Divider as PaperDivider } from 'react-native-paper';

import { C, Spacing } from '@/src/theme';

interface AppDividerProps {
  spacing?: number; // Khoảng cách margin trên dưới
}

export const AppDivider = ({ spacing = Spacing.md }: AppDividerProps) => {
  return <PaperDivider style={[styles.divider, { marginVertical: spacing }]} />
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: C.border,
    height: 1,
  },
});
