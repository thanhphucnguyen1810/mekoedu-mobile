import React from 'react';
import { Text, View, StyleSheet } from "react-native";
import { useTheme } from '@/src/theme';
import { AppText, AppHeader } from '@/src/components/common';

export default function ExamsScreen() {
  const { c, spacing, typography } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <AppHeader title="Trang thi" />
      <View style={{ padding: spacing.layout.screenHorizontal }}>
        <AppText style={{ color: c.text, ...typography.variants.h3 }}>
          Thi nè!!
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})
