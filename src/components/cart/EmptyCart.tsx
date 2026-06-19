import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { Colors, Spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MEKO_RED } from './cartConstants';

export function EmptyCart() {
  const cartConfig = AppConfig.cart;

  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name="cart-outline" size={56} color={Colors.primary[300]} />
      </View>
      <AppText variant="h4" weight="600" style={styles.title}>
        {cartConfig.emptyTitle}
      </AppText>
      <AppText variant="body2" color="textSub" style={styles.sub}>
        {cartConfig.emptyMessage}
      </AppText>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.push('/(tabs)/courses')}
        activeOpacity={0.85}
      >
        <AppText variant="body2" weight="700" style={{ color: '#fff' }}>
          {cartConfig.emptyButton}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, backgroundColor: MEKO_RED, paddingHorizontal: 28, paddingVertical: 12, borderRadius: Spacing.borderRadius.md },
});
