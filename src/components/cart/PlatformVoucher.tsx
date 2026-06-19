import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MEKO_RED } from './cartConstants';

export function PlatformVoucher() {
  const { c } = useTheme();
  const cartConfig = AppConfig.cart;

  return (
    <TouchableOpacity style={[styles.wrap, { backgroundColor: c.bg }]} activeOpacity={0.7}>
      <View style={styles.left}>
        <Ionicons name="gift-outline" size={18} color={MEKO_RED} />
        <View>
          <AppText variant="body2" weight="600">{cartConfig.platformVoucherTitle}</AppText>
          <AppText variant="caption" color="textSub">{cartConfig.platformVoucherSub}</AppText>
        </View>
      </View>
      <View style={styles.right}>
        <AppText variant="caption" style={{ color: MEKO_RED }}>{cartConfig.platformVoucherAction}</AppText>
        <Ionicons name="chevron-forward" size={14} color={MEKO_RED} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
