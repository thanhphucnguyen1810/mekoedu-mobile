import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ActivityIndicator, Alert, FlatList, Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { useCartSync } from '@/src/hooks/useCartSync';
import { clearCart as clearCartAPI, applyCoupon as applyCouponAPI, removeCoupon as removeCouponAPI } from '@/src/services/liferay';
import {
  CartItem,
  clearCart,
  deselectAllItems,
  applyCoupon as reduxApplyCoupon,
  removeCoupon as reduxRemoveCoupon,
  selectAllItems,
  selectAppliedCoupon,
  selectCartId,
  selectCartItems,
  selectCartSyncing,
  selectIsAllSelected,
  selectSelectedIds,
  toggleSelectItem,
} from '@/src/store/slices/cartSlice';
import { selectAccountId } from '@/src/store/slices/liferayAuthSlice';

// Import from src/components/cart
import { CartHeader } from '@/src/components/cart/CartHeader';
import { EmptyCart } from '@/src/components/cart/EmptyCart';
import { CheckoutBar } from '@/src/components/cart/CheckoutBar';
import { ShopHeader } from '@/src/components/cart/ShopHeader';
import { CartItemCard } from '@/src/components/cart/CartItemCard';
import { CouponSection } from '@/src/components/cart/CouponSection';
import { PlatformVoucher } from '@/src/components/cart/PlatformVoucher';
import { OrderSummaryCard } from '@/src/components/cart/OrderSummaryCard';
import { SectionSep } from '@/src/components/cart/SectionSep';
import { MEKO_RED, THUMB_SIZE } from '@/src/components/cart/cartConstants';

type ListRow =
  | { type: 'shopHeader'; shopName: string }
  | { type: 'item'; item: CartItem }
  | { type: 'shopCoupon'; shopName: string }
  | { type: 'sep' }
  | { type: 'platformVoucher' }
  | { type: 'summary' };

export default function CartScreen() {
  const dispatch = useDispatch();
  const { spacing } = useTheme();

  const cartItems = useSelector(selectCartItems);
  const selectedIds = useSelector(selectSelectedIds);
  const cartId = useSelector(selectCartId);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const syncing = useSelector(selectCartSyncing);
  const isAllSelected = useSelector(selectIsAllSelected);

  const { loadCartFromServer, updateQuantityAsync, removeItemAsync } = useCartSync();
  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = syncing || localLoading;

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCartFromServer();
    setRefreshing(false);
  }, [loadCartFromServer]);

  const handleToggleSelect = useCallback((id: string | number) => dispatch(toggleSelectItem(id)), [dispatch]);
  const handleToggleAll = useCallback(() => isAllSelected ? dispatch(deselectAllItems()) : dispatch(selectAllItems()), [dispatch, isAllSelected]);
  const handleRemove = useCallback((item: CartItem) => {
    Alert.alert('Xoá khoá học', `Xoá "${item.name}" khỏi giỏ hàng?`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => removeItemAsync(item.id, item.cartItemId) },
    ]);
  }, [removeItemAsync]);
  const handleQtyChange = useCallback((item: CartItem, qty: number) => updateQuantityAsync(item.id, item.cartItemId, qty), [updateQuantityAsync]);
  const handleClearCart = useCallback(() => {
    Alert.alert('Xoá giỏ hàng', 'Xoá toàn bộ khoá học trong giỏ?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá tất cả', style: 'destructive', onPress: async () => { if (cartId) { setLocalLoading(true); await clearCartAPI(cartId); dispatch(clearCart()); setLocalLoading(false); } } },
    ]);
  }, [dispatch, cartId]);
  const handleApplyCoupon = useCallback(async (code: string) => {
    if (!cartId) return;
    setLocalLoading(true);
    const updatedCart = await applyCouponAPI(cartId, code);
    if (updatedCart) {
      dispatch(reduxApplyCoupon({ code: code.toUpperCase(), discountType: 'fixed', discountValue: updatedCart.discountTotal ?? 0 }));
      Alert.alert('✓ Áp dụng thành công', `Mã ${code.toUpperCase()} đã được áp dụng.`);
    } else Alert.alert('Mã không hợp lệ', 'Vui lòng kiểm tra lại mã giảm giá.');
    setLocalLoading(false);
  }, [dispatch, cartId]);
  const handleRemoveCoupon = useCallback(async () => {
    if (!cartId) return;
    setLocalLoading(true);
    const ok = await removeCouponAPI(cartId);
    if (ok) dispatch(reduxRemoveCoupon());
    setLocalLoading(false);
  }, [dispatch, cartId]);
  const handleCheckout = useCallback(() => {
    const selectedItems = cartItems.filter(i => selectedIds.includes(i.id));
    router.push({ pathname: '/cart/checkout', params: { selectedItems: JSON.stringify(selectedItems.map(i => i.id)), coupon: appliedCoupon ? JSON.stringify(appliedCoupon) : undefined } });
  }, [cartItems, selectedIds, appliedCoupon]);

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
      rows.push({ type: 'shopCoupon', shopName });
      if (idx < shopGroups.length - 1) rows.push({ type: 'sep' });
    });
    rows.push({ type: 'sep' }, { type: 'platformVoucher' }, { type: 'sep' }, { type: 'summary' });
    return rows;
  }, [shopGroups]);

  const shopAllChecked = useCallback((items: CartItem[]) => items.every(i => selectedIds.includes(i.id)), [selectedIds]);
  const toggleShopAll = useCallback((items: CartItem[]) => {
    const allChecked = items.every(i => selectedIds.includes(i.id));
    items.forEach(i => {
      const isSelected = selectedIds.includes(i.id);
      if ((allChecked && isSelected) || (!allChecked && !isSelected)) dispatch(toggleSelectItem(i.id));
    });
  }, [dispatch, selectedIds]);

  const renderRow = useCallback(({ item: row }: { item: ListRow }) => {
    if (row.type === 'sep') return <SectionSep />;
    if (row.type === 'platformVoucher') return <><PlatformVoucher /><CouponSection appliedCoupon={appliedCoupon} onApply={handleApplyCoupon} onRemove={handleRemoveCoupon} /></>;
    if (row.type === 'summary') return <OrderSummaryCard />;
    if (row.type === 'shopHeader') {
      const shopItems = shopGroups.find(([n]) => n === row.shopName)?.[1] ?? [];
      return <ShopHeader shopName={row.shopName} allChecked={shopAllChecked(shopItems)} onToggleAll={() => toggleShopAll(shopItems)} />;
    }
    if (row.type === 'shopCoupon') return null;
    if (row.type === 'item') {
      return (
        <>
          <CartItemCard item={row.item} selected={selectedIds.includes(row.item.id)} onToggleSelect={handleToggleSelect} onRemove={handleRemove} onQuantityChange={handleQtyChange} />
          <View style={{ height: 0.5, backgroundColor: Colors.neutral[100], marginLeft: THUMB_SIZE + 10 + Spacing.md + 22 + 10 }} />
        </>
      );
    }
    return null;
  }, [selectedIds, shopGroups, appliedCoupon, shopAllChecked, toggleShopAll, handleToggleSelect, handleRemove, handleQtyChange, handleApplyCoupon, handleRemoveCoupon]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={MEKO_RED} />
      <CartHeader itemCount={cartItems.length} onClear={handleClearCart} />
      {isLoading && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color={MEKO_RED} /></View>}
      {cartItems.length === 0 ? <EmptyCart /> : (
        <>
          <FlatList data={listData} keyExtractor={(row, idx) => row.type === 'item' ? `item-${row.item.id}` : row.type === 'shopHeader' ? `shopH-${row.shopName}` : `${row.type}-${idx}`} renderItem={renderRow} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} removeClippedSubviews={Platform.OS === 'android'} />
          <CheckoutBar onCheckout={handleCheckout} isAllSelected={isAllSelected} onToggleAll={handleToggleAll} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.tertiary },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.65)', zIndex: 999, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: Spacing['3xl'] },
});
