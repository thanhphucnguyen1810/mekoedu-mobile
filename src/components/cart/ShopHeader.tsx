// src/components/cart/ShopHeader.tsx

import { AppText } from '@/src/components/common';
import { AppConfig } from '@/src/config/appConfig';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MEKO_RED } from './cartConstants';

type Props = {
  shopName: string;
};

export function ShopHeader({ shopName }: Props) {
  const { c } = useTheme();
  const cartConfig = AppConfig.cart;

  return (
    <View style={[styles.header, { borderBottomColor: c.border }]}>
      <Ionicons name="storefront-outline" size={16} color={MEKO_RED} />
      <AppText variant="body2" weight="600" style={{ flex: 1 }}>
        {shopName}
      </AppText>
      <TouchableOpacity style={styles.voucherBtn}>
        <Ionicons name="pricetag-outline" size={13} color={MEKO_RED} />
        <AppText variant="caption" color="primary" style={{ marginLeft: 3 }}>
          {cartConfig.shopVoucher}
        </AppText>
        <Ionicons name="chevron-forward" size={12} color={MEKO_RED} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: Spacing.sm, 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 10, 
    borderBottomWidth: 0.5 
  },
  voucherBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.primary[50], 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: Spacing.borderRadius.sm 
  },
});
