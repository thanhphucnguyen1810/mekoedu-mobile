import { useTheme } from '@/src/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export const Skeleton = ({ width, height, style }: { width?: any, height: any, style?: any }) => {
  const { c } = useTheme();
  return (
    <View style={[styles.skeleton, { width, height, backgroundColor: c.border + '40' }, style]} />
  );
};

const styles = StyleSheet.create({
  skeleton: { borderRadius: 8 }
});
