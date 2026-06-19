import { AppText } from '@/src/components/common';
import { SCheckbox } from '@/src/components/common/SCheckbox';
import { AppConfig } from '@/src/config/appConfig';
import { selectFinalTotal, selectSelectedItems } from '@/src/store/slices/cartSlice';
import { Spacing, useTheme } from '@/src/theme';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { MEKO_RED } from './cartConstants';
import { fmtVND } from './cartHelpers';

export function CheckoutBar({
  onCheckout,
  isAllSelected,
  onToggleAll,
}: {
  onCheckout: () => void;
  isAllSelected: boolean;
  onToggleAll: () => void;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const cartConfig = AppConfig.cart;
  const selectedItems = useSelector(selectSelectedItems);
  const finalTotal = useSelector(selectFinalTotal);
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, paddingBottom: insets.bottom + 4, borderTopColor: c.border }]}>
      <View style={styles.left}>
        <SCheckbox checked={isAllSelected} onPress={onToggleAll} size={22} />
        <AppText variant="caption" style={styles.allLabel}>{cartConfig.selectAll}</AppText>
      </View>

      <View style={styles.right}>
        <View style={styles.totalCol}>
          <View style={styles.totalRow}>
            <AppText variant="caption" color="textSub">{cartConfig.totalLabel}</AppText>
            <AppText style={styles.totalAmt}>{fmtVND(finalTotal)}</AppText>
          </View>
          {selectedCount > 0 && (
            <AppText variant="caption" color="textSub" style={styles.savingsHint}>
              Đã chọn {selectedCount} khoá học
            </AppText>
          )}
        </View>

        <TouchableOpacity
          style={[styles.checkoutBtn, { opacity: selectedCount === 0 ? 0.5 : 1 }]}
          onPress={onCheckout}
          disabled={selectedCount === 0}
          activeOpacity={0.85}
        >
          <AppText variant="body2" weight="700" style={{ color: '#fff', letterSpacing: 0.3 }}>
            {selectedCount > 0 
              ? cartConfig.checkoutButtonWithCount(selectedCount)
              : cartConfig.checkoutButton}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    borderTopWidth: 0.5,
    gap: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  allLabel: { fontSize: 12 },
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  totalCol: { alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline' },
  totalAmt: { fontSize: 16, fontWeight: '700', color: MEKO_RED },
  savingsHint: { fontSize: 10 },
  checkoutBtn: { backgroundColor: MEKO_RED, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Spacing.borderRadius.sm },
});
