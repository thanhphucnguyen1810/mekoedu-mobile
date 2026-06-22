// src/components/cart/CheckoutBar.tsx

import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { selectCartFinalTotalServer, selectCartItems } from '@/src/store/slices/cartSlice';
import { Spacing, useTheme } from '@/src/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { MEKO_RED } from './cartConstants';
import { fmtVND } from './cartHelpers';

export function CheckoutBar({
  onCheckout,
}: {
  onCheckout: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const cartConfig = AppConfig.cart;
  const cartItems = useSelector(selectCartItems);
  const finalTotal = useSelector(selectCartFinalTotalServer);
  const totalQuantity = cartItems.reduce((s, i) => s + i.quantity, 0);
  const isEmpty = totalQuantity === 0;

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, paddingBottom: insets.bottom + 4, borderTopColor: c.border }]}>
      <View style={styles.totalCol}>
        <View style={styles.totalRow}>
          <AppText variant="caption" color="textSub">{cartConfig.totalLabel}</AppText>
          <AppText style={styles.totalAmt}>{fmtVND(finalTotal)}</AppText>
        </View>
        {totalQuantity > 0 && (
          <AppText variant="caption" color="textSub" style={styles.savingsHint}>
            {totalQuantity} khoá học
          </AppText>
        )}
      </View>

      <TouchableOpacity
        style={[styles.checkoutBtn, { opacity: isEmpty ? 0.5 : 1 }]}
        onPress={onCheckout}
        disabled={isEmpty}
        activeOpacity={0.85}
      >
        <AppText variant="body2" weight="700" style={{ color: '#fff', letterSpacing: 0.3 }}>
          {totalQuantity > 0
            ? cartConfig.checkoutButtonWithCount(totalQuantity)
            : cartConfig.checkoutButton}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    borderTopWidth: 0.5,
    gap: 10,
  },
  totalCol: { alignItems: 'flex-start' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  totalAmt: { fontSize: 16, fontWeight: '700', color: MEKO_RED },
  savingsHint: { fontSize: 10 },
  checkoutBtn: { backgroundColor: MEKO_RED, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Spacing.borderRadius.sm },
});
