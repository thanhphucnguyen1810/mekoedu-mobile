import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { Coupon } from '@/src/store/slices/cartSlice';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { MEKO_RED } from './cartConstants';
import { fmtVND } from './cartHelpers';

export function CouponSection({
  appliedCoupon,
  onApply,
  onRemove,
}: {
  appliedCoupon: Coupon | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const { c } = useTheme();
  const cartConfig = AppConfig.cart;
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(false);

  if (appliedCoupon) {
    return (
      <View style={[styles.appliedWrap, { backgroundColor: c.bg }]}>
        <View style={styles.appliedLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="pricetag" size={16} color={MEKO_RED} />
          </View>
          <View>
            <AppText variant="body2" weight="600" style={{ color: MEKO_RED }}>
              {appliedCoupon.code}
            </AppText>
            <AppText variant="caption" color="textSub">
              {appliedCoupon.discountType === 'percentage'
                ? `Giảm ${appliedCoupon.discountValue}%`
                : `Giảm ${fmtVND(appliedCoupon.discountValue)}`}
            </AppText>
          </View>
        </View>
        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="close-circle" size={20} color={Colors.neutral[400]} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <Ionicons name="pricetag-outline" size={18} color={MEKO_RED} />
      <TextInput
        style={[styles.input, { color: c.text }]}
        placeholder={cartConfig.couponPlaceholder}
        placeholderTextColor={Colors.neutral[400]}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        returnKeyType="done"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={() => {
          if (code.trim()) { onApply(code.trim()); setCode(''); }
        }}
      />
      <TouchableOpacity
        style={[styles.applyBtn, { opacity: code.trim() ? 1 : 0.4 }]}
        onPress={() => {
          if (code.trim()) { onApply(code.trim()); setCode(''); }
        }}
        disabled={!code.trim()}
      >
        <AppText variant="caption" weight="600" style={{ color: MEKO_RED }}>
          {cartConfig.couponApply}
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.neutral[100],
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  applyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: MEKO_RED,
    borderRadius: Spacing.borderRadius.sm,
  },
  appliedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: Colors.neutral[100],
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
