// app/cart/index.tsx
import { useCartSync } from '@/src/hooks/useCartSync';
import {
  CartItem,
  selectAppliedCoupon,
  selectCartItems,
  selectCartSyncing,
  selectLastSyncedAt,
} from '@/src/store/slices/cartSlice';
import { Colors, Spacing } from '@/src/theme';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';

import { CartHeader } from '@/src/components/cart/CartHeader';
import { CartItemCard } from '@/src/components/cart/CartItemCard';
import { CheckoutBar } from '@/src/components/cart/CheckoutBar';
import { CouponSection } from '@/src/components/cart/CouponSection';
import { EmptyCart } from '@/src/components/cart/EmptyCart';
import { OrderSummaryCard } from '@/src/components/cart/OrderSummaryCard';
import { PlatformVoucher } from '@/src/components/cart/PlatformVoucher';
import { SectionSep } from '@/src/components/cart/SectionSep';
import { ShopHeader } from '@/src/components/cart/ShopHeader';
import { MEKO_RED, THUMB_SIZE } from '@/src/components/cart/cartConstants';

type ListRow =
  | { type: 'shopHeader'; shopName: string }
  | { type: 'item'; item: CartItem }
  | { type: 'sep' }
  | { type: 'platformVoucher' }
  | { type: 'summary' };

export default function CartScreen() {
  const cartItems    = useSelector(selectCartItems);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const syncing      = useSelector(selectCartSyncing);

  const {
    loadCartFromServer,
    updateQuantityAsync,
    removeItemAsync,
    clearCartAsync,
    applyCouponAsync,
    removeCouponAsync,
    checkoutAsync,
  } = useCartSync();

  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = syncing || localLoading;
  const [refreshing, setRefreshing] = useState(false);

  // (cartId là null lúc đầu, phụ thuộc nó sẽ gây re-trigger khi sync xong)
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    const now = Date.now();
    const last = selectLastSyncedAt ? new Date(selectLastSyncedAt).getTime() : 0;
    if (now - last > 5000) { // chỉ fetch nếu đã qua 5s
      console.log('[CartScreen] mount → loadCartFromServer');
      loadCartFromServer();
    }
  }, [loadCartFromServer]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCartFromServer();
    setRefreshing(false);
  }, [loadCartFromServer]);

  const handleRemove = useCallback(async (item: CartItem) => {
  setLocalLoading(true);
  try {
    await removeItemAsync(item.id, item.cartItemId);
  } catch {
    Alert.alert('Lỗi', 'Không thể xóa sản phẩm. Vui lòng thử lại.');
  } finally {
    setLocalLoading(false);
  }
}, [removeItemAsync, setLocalLoading]);

  const handleQtyChange = useCallback((item: CartItem, qty: number) => {
    updateQuantityAsync(item.id, item.cartItemId, qty);
  }, [updateQuantityAsync]);

  const handleClearCart = useCallback(() => {
    if (cartItems.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng của bạn đang trống.');
      return;
    }
    Alert.alert(
      'Xoá giỏ hàng',
      `Bạn có chắc muốn xoá tất cả ${cartItems.length} sản phẩm?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá tất cả',
          style: 'destructive',
          onPress: async () => {
            setLocalLoading(true);
            try {
              const ok = await clearCartAsync();
              if (!ok) Alert.alert('Lỗi', 'Không thể xóa hết giỏ hàng. Vui lòng thử lại.');
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa giỏ hàng. Vui lòng thử lại.');
            } finally {
              setLocalLoading(false);
            }
          },
        },
      ]
    );
  }, [cartItems.length, clearCartAsync]);

  const handleApplyCoupon = useCallback(async (code: string) => {
    setLocalLoading(true);
    try {
      const ok = await applyCouponAsync(code);
      if (ok) {
        Alert.alert('✓ Áp dụng thành công', `Mã ${code.toUpperCase()} đã được áp dụng.`);
      } else {
        Alert.alert('Mã không hợp lệ', 'Vui lòng kiểm tra lại mã giảm giá.');
      }
    } finally {
      setLocalLoading(false);
    }
  }, [applyCouponAsync]);

  const handleRemoveCoupon = useCallback(async () => {
    setLocalLoading(true);
    try {
      await removeCouponAsync();
    } finally {
      setLocalLoading(false);
    }
  }, [removeCouponAsync]);

  const handleCheckout = useCallback(async () => {
    if (cartItems.length === 0) {
      Alert.alert('Thông báo', 'Giỏ hàng trống, không thể thanh toán.');
      return;
    }
    setLocalLoading(true);
    try {
      const result = await checkoutAsync();
      if (!result) {
        Alert.alert('Lỗi', 'Không thể tạo đơn hàng. Vui lòng thử lại.');
        return;
      }
      router.push({
        pathname: '/cart/checkout',
        params: {
          orderId: String(result.orderId),
          finalTotal: String(result.finalTotal),
        },
      });
    } catch {
      Alert.alert('Lỗi', 'Không thể thanh toán. Vui lòng thử lại.');
    } finally {
      setLocalLoading(false);
    }
  }, [cartItems.length, checkoutAsync]);

  const shopGroups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const key = item.catalogName ?? 'MekoEdu';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [cartItems]);

  const listData: ListRow[] = useMemo(() => {
    const rows: ListRow[] = [];
    shopGroups.forEach(([shopName, items], idx) => {
      rows.push({ type: 'shopHeader', shopName });
      items.forEach(item => rows.push({ type: 'item', item }));
      if (idx < shopGroups.length - 1) rows.push({ type: 'sep' });
    });
    rows.push({ type: 'sep' }, { type: 'platformVoucher' }, { type: 'sep' }, { type: 'summary' });
    return rows;
  }, [shopGroups]);

  const renderRow = useCallback(({ item: row }: { item: ListRow }) => {
    if (row.type === 'sep') return <SectionSep />;
    // if (row.type === 'platformVoucher') return (
    //   <><PlatformVoucher /><CouponSection appliedCoupon={appliedCoupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} /></>
    // );
    if (row.type === 'summary') return <OrderSummaryCard />;
    if (row.type === 'shopHeader') return <ShopHeader shopName={row.shopName} />;
    if (row.type === 'item') return (
      <>
        <CartItemCard item={row.item} onRemove={handleRemove} onQuantityChange={handleQtyChange} />
        <View style={{ height: 0.5, backgroundColor: Colors.neutral[100], marginLeft: THUMB_SIZE + 10 + Spacing.md + 22 + 10 }} />
      </>
    );
    return null;
  }, [appliedCoupon, handleRemove, handleQtyChange, handleApplyCoupon, handleRemoveCoupon]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MEKO_RED} />
      <CartHeader itemCount={cartItems.length} onClear={handleClearCart} />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MEKO_RED} />
        </View>
      )}

      {cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <FlatList
            data={listData}
            keyExtractor={(row, idx) =>
              row.type === 'item' ? `item-${row.item.id}`
              : row.type === 'shopHeader' ? `shopH-${row.shopName}`
              : `${row.type}-${idx}`
            }
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={MEKO_RED}
                colors={[MEKO_RED]}
              />
            }
          />
          <CheckoutBar onCheckout={handleCheckout} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.tertiary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { paddingBottom: Spacing['3xl'] },
});
