// src/components/cart/OrderSummaryCard.tsx

import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import {
  selectAppliedCoupon,
  selectCartFinalTotalServer,
  selectCartItems,
  selectCartOriginalTotal,
  selectCartSavings,
} from '@/src/store/slices/cartSlice';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MEKO_RED } from './cartConstants';
import { fmtVND } from './cartHelpers';

export function OrderSummaryCard() {
  const { c } = useTheme();
  const cartConfig = AppConfig.cart;
  const cartItems = useSelector(selectCartItems);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const finalTotal = useSelector(selectCartFinalTotalServer);
  const originalTotal = useSelector(selectCartOriginalTotal);
  const savings = useSelector(selectCartSavings);

  if (cartItems.length === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <AppText variant="body2" weight="600" style={styles.title}>
        {cartConfig.orderSummaryTitle}
      </AppText>

      <View style={styles.row}>
        <AppText variant="caption" color="textSub">{cartConfig.subtotalLabel}</AppText>
        <AppText variant="caption">{fmtVND(originalTotal)}</AppText>
      </View>

      {savings > 0 && (
        <View style={styles.row}>
          <AppText variant="caption" color="textSub">{cartConfig.productDiscountLabel}</AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>-{fmtVND(savings)}</AppText>
        </View>
      )}

      {appliedCoupon && (
        <View style={styles.row}>
          <AppText variant="caption" color="textSub">{cartConfig.couponDiscountLabel} {appliedCoupon.code}</AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>
            -{fmtVND(originalTotal - savings - finalTotal)}
          </AppText>
        </View>
      )}

      <View style={[styles.row, styles.totalRow]}>
        <AppText variant="body2" weight="600">{cartConfig.finalTotalLabel}</AppText>
        <AppText style={styles.totalAmt}>{fmtVND(finalTotal)}</AppText>
      </View>

      {(savings > 0 || appliedCoupon) && (
        <View style={styles.savingsBar}>
          <Ionicons name="happy-outline" size={14} color={MEKO_RED} />
          <AppText variant="caption" style={{ color: MEKO_RED, marginLeft: 4 }}>
            {cartConfig.savingsMessage(fmtVND(savings + (originalTotal - savings - finalTotal)))}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 8 },
  title: { marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { paddingTop: 8, borderTopWidth: 0.5, borderTopColor: Colors.neutral[100], marginTop: 4 },
  totalAmt: { fontSize: 16, fontWeight: '700', color: MEKO_RED },
  savingsBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary[50], paddingHorizontal: 10, paddingVertical: 6, borderRadius: Spacing.borderRadius.sm, marginTop: 4 },
});
