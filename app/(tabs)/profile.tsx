import React from 'react';
import { Text, View, StyleSheet } from "react-native";
import { useTheme } from '@/src/theme';
import { AppText, AppHeader } from '@/src/components/common';

export default function ProfileScreen() {
  const { c, spacing, typography } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <AppHeader title="Thông tin cá nhân" />
      <View style={{ padding: spacing.layout.screenHorizontal }}>
        <AppText style={{ color: c.text, ...typography.variants.h3 }}>
          Chào mừng bạn quay trở lại!
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
