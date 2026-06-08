// app/cart/index.tsx
import {
  AppButton,
  AppCard,
  AppDivider,
  AppHeader,
  AppText,
} from '@/src/components/common';
import { useCartSync } from '@/src/hooks/useCartSync';
import { cartService } from '@/src/services/cartService';
import {
  CartItem,
  clearCart,
  Coupon,
  deselectAllItems,
  applyCoupon as reduxApplyCoupon,
  removeCoupon as reduxRemoveCoupon,
  selectAllItems,
  selectAppliedCoupon,
  selectCartId,
  selectCartItems,
  selectCartSyncing,
  selectFinalTotal,
  selectIsAllSelected,
  selectSelectedIds,
  selectSelectedItems,
  toggleSelectItem,
} from '@/src/store/slices/cartSlice';
import { selectAccountId } from '@/src/store/slices/liferayAuthSlice';
import { Colors, Spacing, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const effectivePrice = (item: CartItem) =>
  item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
    ? item.promoPrice
    : item.price;

// ─── CartItemCard ─────────────────────────────────────────────────────────────

function CartItemCard({
  item,
  selected,
  onToggleSelect,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  selected: boolean;
  onToggleSelect: (id: string | number) => void;
  onRemove: (item: CartItem) => void;
  onQuantityChange: (item: CartItem, qty: number) => void;
}) {
  const { c } = useTheme();
  const price = effectivePrice(item);
  const hasDiscount =
    item.promoPrice != null && item.promoPrice > 0 && item.promoPrice < item.price;
  const discountPct = hasDiscount
    ? Math.round((1 - item.promoPrice! / item.price) * 100)
    : 0;

  return (
    <AppCard style={styles.itemCard} padding="md">
      <View style={styles.itemContent}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, { borderColor: c.border }]}
          onPress={() => onToggleSelect(item.id)}
        >
          {selected && (
            <View style={[styles.checkboxFill, { backgroundColor: Colors.primary[500] }]}>
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
          )}
        </TouchableOpacity>

        {/* Thumbnail */}
        <View style={styles.thumb}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbImg} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: c.border }]}>
              <Ionicons name="book-outline" size={Spacing.xl} color={c.textSub} />
            </View>
          )}
          {hasDiscount && (
            <View style={[styles.discountBadge, { backgroundColor: Colors.error }]}>
              <AppText variant="overline" style={styles.discountBadgeText}>
                -{discountPct}%
              </AppText>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          {item.catalogName && (
            <AppText variant="caption" color="primary" style={{ textTransform: 'uppercase' }}>
              {item.catalogName}
            </AppText>
          )}
          <AppText variant="body2" weight="600" numberOfLines={2}>
            {item.name}
          </AppText>

          <View style={styles.priceRow}>
            <AppText variant="body1" weight="700" color="primary">
              {fmtVND(price)}
            </AppText>
            {hasDiscount && (
              <AppText variant="caption" color="textSub" style={styles.strikethrough}>
                {fmtVND(item.price)}
              </AppText>
            )}
          </View>

          {/* Qty + Remove */}
          <View style={styles.actionsRow}>
            <View style={[styles.qtyControl, { borderColor: c.border }]}>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: c.bgSoft }]}
                onPress={() =>
                  item.quantity > 1
                    ? onQuantityChange(item, item.quantity - 1)
                    : onRemove(item)
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={styles.qtyBtnText}>−</AppText>
              </TouchableOpacity>
              <AppText variant="body2" weight="600" style={styles.qtyValue}>
                {item.quantity}
              </AppText>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: c.bgSoft }]}
                onPress={() => onQuantityChange(item, item.quantity + 1)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppText style={styles.qtyBtnText}>+</AppText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => onRemove(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AppCard>
  );
}

// ─── CouponSection ────────────────────────────────────────────────────────────

function CouponSection({
  appliedCoupon,
  onApply,
  onRemove,
}: {
  appliedCoupon: Coupon | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const { c } = useTheme();
  const [code, setCode] = useState('');

  if (appliedCoupon) {
    return (
      <AppCard style={styles.couponCard} padding="md">
        <View style={styles.couponAppliedRow}>
          <View style={styles.couponIcon}>
            <Ionicons name="pricetag" size={20} color={Colors.primary[500]} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="body2" weight="600" color="primary">
              Đã áp dụng: {appliedCoupon.code}
            </AppText>
            <AppText variant="caption" color="textSub">
              {appliedCoupon.discountType === 'percentage'
                ? `Giảm ${appliedCoupon.discountValue}%`
                : `Giảm ${fmtVND(appliedCoupon.discountValue)}`}
            </AppText>
          </View>
          <TouchableOpacity onPress={onRemove}>
            <Ionicons name="close-circle" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.couponCard} padding="md">
      <AppText variant="body2" weight="600" style={{ marginBottom: Spacing.sm }}>
        Mã giảm giá
      </AppText>
      <View style={styles.couponInputRow}>
        <View style={[styles.couponInputWrap, { borderColor: c.border, backgroundColor: c.bgSoft }]}>
          <Ionicons name="pricetag-outline" size={20} color={c.textSub} />
          <TextInput
            style={[styles.couponInput, { color: c.text }]}
            placeholder="Nhập mã giảm giá"
            placeholderTextColor={c.textSub}
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.applyBtn,
            { backgroundColor: code.trim() ? Colors.primary[500] : c.border },
          ]}
          onPress={() => {
            if (code.trim()) {
              onApply(code.trim());
              setCode('');
            }
          }}
          disabled={!code.trim()}
        >
          <AppText variant="button" style={{ color: Colors.neutral[0] }}>
            Áp dụng
          </AppText>
        </TouchableOpacity>
      </View>
    </AppCard>
  );
}

// ─── OrderSummary ─────────────────────────────────────────────────────────────

function OrderSummary({
  onCheckout,
}: {
  onCheckout: () => void;
}) {
  const selectedItems = useSelector(selectSelectedItems);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const finalTotal    = useSelector(selectFinalTotal);

  const subtotal      = selectedItems.reduce((s, i) => s + effectivePrice(i) * i.quantity, 0);
  const originalTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const saved         = originalTotal - subtotal;
  const discount      = subtotal - finalTotal;
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);

  if (selectedItems.length === 0) {
    const { c } = useTheme();
    return (
      <AppCard style={styles.summaryCard} padding="lg">
        <View style={styles.emptyPrompt}>
          <Ionicons name="checkbox-outline" size={40} color={c.textSub} />
          <AppText variant="body2" color="textSub" style={{ textAlign: 'center', marginTop: Spacing.sm }}>
            Vui lòng chọn ít nhất một khoá học
          </AppText>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.summaryCard} padding="lg">
      <AppText variant="h4" weight="600" style={{ marginBottom: Spacing.md }}>
        Tóm tắt đơn hàng
      </AppText>

      <View style={styles.summaryRow}>
        <AppText variant="body2" color="textSub">Tạm tính ({selectedCount} sản phẩm)</AppText>
        <AppText variant="body2" weight="500">{fmtVND(originalTotal)}</AppText>
      </View>

      {saved > 0 && (
        <View style={styles.summaryRow}>
          <AppText variant="body2" color="success" weight="500">Tiết kiệm</AppText>
          <AppText variant="body2" color="success" weight="600">-{fmtVND(saved)}</AppText>
        </View>
      )}

      {discount > 0 && appliedCoupon && (
        <View style={styles.summaryRow}>
          <AppText variant="body2" color="primary" weight="500">
            Mã {appliedCoupon.code}
          </AppText>
          <AppText variant="body2" color="primary" weight="600">-{fmtVND(discount)}</AppText>
        </View>
      )}

      <AppDivider style={{ marginVertical: Spacing.md }} />

      <View style={styles.summaryRow}>
        <AppText variant="body1" weight="700">Tổng cộng</AppText>
        <AppText variant="h3" weight="700" color="primary">{fmtVND(finalTotal)}</AppText>
      </View>

      <AppButton
        title={`Thanh toán ngay (${selectedCount})`}
        onPress={onCheckout}
        variant="primary"
        size="large"
        style={{ marginTop: Spacing.lg }}
      />
      <AppButton
        title="Tiếp tục mua sắm"
        onPress={() => router.push('/(tabs)/courses')}
        variant="outline"
        size="medium"
        style={{ marginTop: Spacing.md }}
      />
    </AppCard>
  );
}

// ─── EmptyCart ────────────────────────────────────────────────────────────────

function EmptyCart() {
  const { c } = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={c.textSub} />
      <AppText variant="h3" style={{ marginVertical: Spacing.sm, textAlign: 'center' }}>
        Giỏ hàng trống
      </AppText>
      <AppText variant="body2" color="textSub" style={{ textAlign: 'center', marginBottom: Spacing.xl }}>
        Bạn chưa thêm khoá học nào.
      </AppText>
      <AppButton
        title="Khám phá ngay"
        onPress={() => router.push('/(tabs)/courses')}
        variant="primary"
        size="large"
        style={{ minWidth: 200 }}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CartScreen() {
  const dispatch = useDispatch();
  const { c } = useTheme();

  const cartItems     = useSelector(selectCartItems);
  const selectedIds   = useSelector(selectSelectedIds);
  const cartId        = useSelector(selectCartId);        // number | null
  const accountId     = useSelector(selectAccountId) as number;
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const syncing       = useSelector(selectCartSyncing);
  const isAllSelected = useSelector(selectIsAllSelected);

  const { loadCartFromServer, updateQuantityAsync, removeItemAsync } = useCartSync();

  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = syncing || localLoading;

  // Tải giỏ hàng khi vào màn hình
  useEffect(() => {
    loadCartFromServer();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleSelect = useCallback(
    (id: string | number) => dispatch(toggleSelectItem(id)),
    [dispatch]
  );

  const handleSelectAll = useCallback(
    () => (isAllSelected ? dispatch(deselectAllItems()) : dispatch(selectAllItems())),
    [dispatch, isAllSelected]
  );

  const handleRemove = useCallback(
    (item: CartItem) => {
      Alert.alert('Xoá sản phẩm', `Xoá "${item.name}" khỏi giỏ hàng?`, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          // cartItemId là Liferay cartItemId – dùng để gọi DELETE /cart-items/{cartItemId}
          onPress: () => removeItemAsync(item.id, item.cartItemId),
        },
      ]);
    },
    [removeItemAsync]
  );

  const handleQtyChange = useCallback(
    (item: CartItem, qty: number) => {
      // cartItemId là Liferay cartItemId – dùng để gọi PATCH /cart-items/{cartItemId}
      updateQuantityAsync(item.id, item.cartItemId, qty);
    },
    [updateQuantityAsync]
  );

  const handleClearCart = useCallback(() => {
    Alert.alert('Xoá giỏ hàng', 'Xoá toàn bộ giỏ hàng?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá tất cả',
        style: 'destructive',
        onPress: async () => {
          if (!cartId) return;          // ← cần cartId, không phải accountId
          setLocalLoading(true);
          await cartService.clearCart(cartId);
          dispatch(clearCart());
          setLocalLoading(false);
        },
      },
    ]);
  }, [dispatch, cartId]);              // ← dependency đổi sang cartId

  const handleApplyCoupon = useCallback(
    async (code: string) => {
      if (!cartId) return;
      setLocalLoading(true);
      const updatedCart = await cartService.applyCoupon(cartId, code);
      if (updatedCart) {
        dispatch(
          reduxApplyCoupon({
            code: code.toUpperCase(),
            discountType: 'fixed',
            discountValue: updatedCart.discountTotal ?? 0,
          })
        );
        Alert.alert('Thành công', `Đã áp dụng mã ${code}`);
      } else {
        Alert.alert('Mã không hợp lệ', 'Vui lòng kiểm tra lại mã giảm giá.');
      }
      setLocalLoading(false);
    },
    [dispatch, cartId]
  );

  const handleRemoveCoupon = useCallback(async () => {
    if (!cartId) return;
    setLocalLoading(true);
    const ok = await cartService.removeCoupon(cartId);
    if (ok) dispatch(reduxRemoveCoupon());
    setLocalLoading(false);
  }, [dispatch, cartId]);

  const handleCheckout = useCallback(() => {
    const selectedItems = cartItems.filter((i) => selectedIds.includes(i.id));
    router.push({
      pathname: '/cart/checkout',
      params: {
        selectedItems: JSON.stringify(selectedItems.map((i) => i.id)),
        coupon: appliedCoupon ? JSON.stringify(appliedCoupon) : undefined,
      },
    });
  }, [cartItems, selectedIds, appliedCoupon]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: Colors.background.secondary }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      <AppHeader
        title="Giỏ hàng"
        showBack
        rightAction={
          cartItems.length > 0 ? { label: 'Xoá tất cả', onPress: handleClearCart } : undefined
        }
      />

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      )}

      {cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          {/* Select All Bar */}
          <View style={[styles.selectBar, { backgroundColor: c.bgSoft }]}>
            <TouchableOpacity style={styles.selectBarLeft} onPress={handleSelectAll}>
              <View style={[styles.checkbox, { borderColor: c.border, marginTop: 0 }]}>
                {isAllSelected && (
                  <View style={[styles.checkboxFill, { backgroundColor: Colors.primary[500] }]}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>
              <AppText variant="body2" weight="500">
                {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </AppText>
            </TouchableOpacity>
            {selectedIds.length > 0 && (
              <View style={[styles.selectedBadge, { backgroundColor: Colors.primary[50] }]}>
                <AppText variant="caption" color="primary" weight="600">
                  Đã chọn {selectedIds.length} mục
                </AppText>
              </View>
            )}
          </View>

          <FlatList
            data={cartItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartItemCard
                item={item}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
                onRemove={handleRemove}
                onQuantityChange={handleQtyChange}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            ListFooterComponent={
              <>
                <CouponSection
                  appliedCoupon={appliedCoupon}
                  onApply={handleApplyCoupon}
                  onRemove={handleRemoveCoupon}
                />
                <OrderSummary onCheckout={handleCheckout} />
              </>
            }
          />
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const THUMB = 80;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.layout.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  selectBarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  selectedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.layout.screenHorizontal,
    paddingBottom: Spacing['3xl'],
  },
  itemCard: { marginBottom: 0 },
  itemContent: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: Spacing.borderWidth.normal,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  checkboxFill: {
    width: '100%',
    height: '100%',
    borderRadius: Spacing.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImg: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  discountBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  discountBadgeText: { color: Colors.neutral[0], fontWeight: 'bold', fontSize: 10 },
  itemInfo: { flex: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginVertical: Spacing.xs },
  strikethrough: { textDecorationLine: 'line-through', fontSize: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: Spacing.borderWidth.normal,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
  },
  qtyBtn: { width: 32, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '600' },
  qtyValue: { minWidth: 36, textAlign: 'center', fontSize: 14 },
  couponCard: { marginTop: Spacing.md },
  couponAppliedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  couponIcon: {
    width: 40,
    height: 40,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  couponInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: Spacing.borderWidth.normal,
    borderRadius: Spacing.borderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  couponInput: { flex: 1, fontSize: 14 },
  applyBtn: {
    paddingHorizontal: Spacing.lg,
    height: 44,
    borderRadius: Spacing.borderRadius.md,
    justifyContent: 'center',
  },
  summaryCard: { marginTop: Spacing.md },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  emptyPrompt: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
