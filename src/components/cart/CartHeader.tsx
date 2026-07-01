import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { Colors, Spacing } from '@/src/theme';

const LAYOUT_PADDING = 8;

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
    <View
      style={[
        styles.wrap,
        {
          paddingTop: insets.top > 0 ? insets.top + 8 : 16,
          paddingBottom: 12,
          marginLeft: -LAYOUT_PADDING,
          marginRight: -LAYOUT_PADDING,
          marginTop: -LAYOUT_PADDING,
          backgroundColor: 'transparent', // ✅ không nền
        },
      ]}
    >
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <AppText variant="body1" weight="600" style={[styles.title, { color: Colors.neutral[900] }]}>
          {cartConfig.title} {itemCount > 0 ? `(${itemCount})` : ''}
        </AppText>
        {itemCount > 0 ? (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppText variant="caption" style={[styles.clearBtn, { color: Colors.neutral[600] }]}>
              {cartConfig.clearAllLabel}
            </AppText>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 56 }} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    // Không có backgroundColor
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + LAYOUT_PADDING,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  clearBtn: {
    fontSize: 12,
  },
});
