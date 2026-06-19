import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import {
  selectAppliedCoupon,
  selectFinalTotal,
  selectSelectedItems,
} from '@/src/store/slices/cartSlice';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { MEKO_RED } from './cartConstants';
import { effectivePrice, fmtVND } from './cartHelpers';

export function OrderSummaryCard() {
  const { c } = useTheme();
  const cartConfig = AppConfig.cart;
  const selectedItems = useSelector(selectSelectedItems);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const finalTotal = useSelector(selectFinalTotal);

  const subtotal = selectedItems.reduce((s, i) => s + effectivePrice(i) * i.quantity, 0);
  const originalTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const savedPromo = originalTotal - subtotal;
  const savedCoupon = subtotal - finalTotal;

  if (selectedItems.length === 0) return null;

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <AppText variant="body2" weight="600" style={styles.title}>
        {cartConfig.orderSummaryTitle}
      </AppText>

      <View style={styles.row}>
        <AppText variant="caption" color="textSub">{cartConfig.subtotalLabel}</AppText>
        <AppText variant="caption">{fmtVND(originalTotal)}</AppText>
      </View>

      {savedPromo > 0 && (
        <View style={styles.row}>
          <AppText variant="caption" color="textSub">{cartConfig.productDiscountLabel}</AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>-{fmtVND(savedPromo)}</AppText>
        </View>
      )}

      {savedCoupon > 0 && appliedCoupon && (
        <View style={styles.row}>
          <AppText variant="caption" color="textSub">{cartConfig.couponDiscountLabel} {appliedCoupon.code}</AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>-{fmtVND(savedCoupon)}</AppText>
        </View>
      )}

      <View style={[styles.row, styles.totalRow]}>
        <AppText variant="body2" weight="600">{cartConfig.finalTotalLabel}</AppText>
        <AppText style={styles.totalAmt}>{fmtVND(finalTotal)}</AppText>
      </View>

      {(savedPromo + savedCoupon) > 0 && (
        <View style={styles.savingsBar}>
          <Ionicons name="happy-outline" size={14} color={MEKO_RED} />
          <AppText variant="caption" style={{ color: MEKO_RED, marginLeft: 4 }}>
            {cartConfig.savingsMessage(fmtVND(savedPromo + savedCoupon))}
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
