import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { Spacing } from '@/src/theme';

import { MEKO_RED } from './cartConstants';

export function CartHeader({
  itemCount,
  onClear,
}: {
  itemCount: number;
  onClear: () => void;
}) {
  const insets = useSafeAreaInsets();
  const cartConfig = AppConfig.cart;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 4 }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <AppText variant="body1" weight="600" style={styles.title}>
        {cartConfig.title} {itemCount > 0 ? `(${itemCount})` : ''}
      </AppText>
      {itemCount > 0 ? (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <AppText variant="caption" style={styles.clearBtn}>
            {cartConfig.clearAllLabel}
          </AppText>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 56 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MEKO_RED,
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
    gap: 12,
  },
  title: { flex: 1, color: '#fff', fontSize: 17 },
  clearBtn: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
});
