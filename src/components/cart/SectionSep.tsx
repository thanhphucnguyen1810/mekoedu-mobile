import { Colors, Spacing } from '@/src/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export function SectionSep() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  sep: { height: Spacing.sm, backgroundColor: Colors.background.tertiary },
});
