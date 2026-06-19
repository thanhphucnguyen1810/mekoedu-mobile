// app/cart/index.tsx
import {
  AppText
} from '@/src/components/common';
import { useCartSync } from '@/src/hooks/useCartSync';
import { clearCart as clearCartAPI, applyCoupon as applyCouponAPI, removeCoupon as removeCouponAPI } from '@/src/services/liferay';

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
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  PanResponder,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

// ─── Constants ────────────────────────────────────────────────────────────────

const MEKO_RED = Colors.primary[500];
const THUMB_SIZE = 88;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const effectivePrice = (item: CartItem) =>
  item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
    ? item.promoPrice
    : item.price;

const discountPct = (item: CartItem) =>
  item.promoPrice && item.promoPrice < item.price
    ? Math.round((1 - item.promoPrice / item.price) * 100)
    : 0;

// ─── Shopee-style Checkbox ─────────────────────────────────────────────────

function SCheckbox({
  checked,
  onPress,
  size = 22,
}: {
  checked: boolean;
  onPress: () => void;
  size?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View
        style={[
          sCheckbox.box,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: checked ? MEKO_RED : 'transparent',
            borderColor: checked ? MEKO_RED : Colors.neutral[300],
            transform: [{ scale }],
          },
        ]}
      >
        {checked && <Ionicons name="checkmark" size={size * 0.6} color="#fff" />}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
const sCheckbox = StyleSheet.create({
  box: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Quantity Stepper ──────────────────────────────────────────────────────

function QtyStepper({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={[sStepper.wrap, { borderColor: c.border }]}>
      <TouchableOpacity
        style={[sStepper.btn, { backgroundColor: c.bgSoft }]}
        onPress={onDecrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="remove" size={14} color={c.text} />
      </TouchableOpacity>
      <View style={sStepper.valWrap}>
        <AppText variant="body2" weight="600" style={sStepper.val}>{value}</AppText>
      </View>
      <TouchableOpacity
        style={[sStepper.btn, { backgroundColor: c.bgSoft }]}
        onPress={onIncrease}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="add" size={14} color={c.text} />
      </TouchableOpacity>
    </View>
  );
}

const sStepper = StyleSheet.create({
  wrap: { flexDirection: 'row', borderWidth: 0.5, borderRadius: Spacing.borderRadius.sm, overflow: 'hidden' },
  btn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  valWrap: { width: 36, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: Colors.neutral[200] },
  val: { fontSize: 13 },
});

// ─── Shop Header ─────────────────────────────────────────────────────────────

function ShopHeader({
  shopName,
  allChecked,
  onToggleAll,
}: {
  shopName: string;
  allChecked: boolean;
  onToggleAll: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={[sShop.header, { borderBottomColor: c.border }]}>
      <SCheckbox checked={allChecked} onPress={onToggleAll} size={20} />
      <Ionicons name="storefront-outline" size={16} color={MEKO_RED} />
      <AppText variant="body2" weight="600" style={{ flex: 1 }}>{shopName}</AppText>
      <TouchableOpacity style={sShop.voucherBtn}>
        <Ionicons name="pricetag-outline" size={13} color={MEKO_RED} />
        <AppText variant="caption" color="primary" style={{ marginLeft: 3 }}>Voucher Shop</AppText>
        <Ionicons name="chevron-forward" size={12} color={MEKO_RED} />
      </TouchableOpacity>
    </View>
  );
}
const sShop = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 0.5 },
  voucherBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary[50], paddingHorizontal: 8, paddingVertical: 4, borderRadius: Spacing.borderRadius.sm },
});

// ─── Cart Item Card ─────────────────────────────────────────────────────────
const DELETE_BTN_WIDTH = 80;
const SWIPE_THRESHOLD = -70;
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
  const pct = discountPct(item);
  
  // Animation value
  const translateX = useRef(new Animated.Value(0)).current;
  // Lưu offset hiện tại để so sánh trong release
  const dragOffset = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isHorizontal = Math.abs(gestureState.dx) > 10;
        const isMoreHorizontalThanVertical =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontal && isMoreHorizontalThanVertical;
      },
      onPanResponderGrant: () => {
        // Dừng animation đang chạy (nếu có) trước khi kéo
        translateX.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Chỉ cho phép trượt sang trái (giá trị âm)
        let newOffset = Math.min(0, gestureState.dx);
        newOffset = Math.max(newOffset, -DELETE_BTN_WIDTH);
        dragOffset.current = newOffset;
        translateX.setValue(newOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        const offset = dragOffset.current;
        if (offset < SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -DELETE_BTN_WIDTH - 20,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onRemove(item);
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start(() => {
            dragOffset.current = 0;
          });
        }
      },
      // Ngăn FlatList cuộn khi đang vuốt ngang
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <View style={sItem.wrapper}>
      {/* Nút xoá (ẩn phía sau) */}
        <View style={[sItem.deleteButton, { backgroundColor: Colors.error, width: DELETE_BTN_WIDTH }]}>
          <View style={sItem.deleteTouch}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
            <AppText style={sItem.deleteText}>Xoá</AppText>
        </View>
      </View>

      {/* Nội dung chính có thể trượt */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          sItem.card,
          {
            transform: [{ translateX }],
            backgroundColor: c.bg,
          },
        ]}
      >
        <View style={sItem.row}>
          {/* Checkbox */}
          <SCheckbox checked={selected} onPress={() => onToggleSelect(item.id)} size={22} />

          {/* Ảnh đại diện */}
          <TouchableOpacity activeOpacity={0.85} style={sItem.thumbWrap}>
            {item.thumbnail ? (
              <Image source={{ uri: item.thumbnail }} style={sItem.thumb} resizeMode="cover" />
            ) : (
              <View style={[sItem.thumbPlaceholder, { backgroundColor: Colors.primary[50] }]}>
                <Ionicons name="book-outline" size={28} color={Colors.primary[300]} />
              </View>
            )}
            {pct > 0 && (
              <View style={sItem.saleBadge}>
                <AppText variant="overline" style={sItem.saleBadgeText}>-{pct}%</AppText>
              </View>
            )}
          </TouchableOpacity>

          {/* Thông tin sản phẩm */}
          <View style={sItem.info}>
            {item.catalogName && (
              <View style={sItem.catalogRow}>
                <Ionicons name="storefront-outline" size={11} color={Colors.neutral[400]} />
                <AppText variant="caption" style={sItem.catalogText}>{item.catalogName}</AppText>
              </View>
            )}

            <AppText variant="body2" weight="500" numberOfLines={2} style={sItem.name}>
              {item.name}
            </AppText>

            {/* Mô tả ngắn - ưu tiên shortDescription, fallback sang description */}
            {(item.shortDescription || item.description) && (
              <View style={[sItem.variationTag, { backgroundColor: c.bgSoft, borderColor: c.border }]}>
                <AppText variant="caption" color="textSub" numberOfLines={1}>
                  {(item.shortDescription || item.description || '').length > 50
                    ? (item.shortDescription || item.description || '').substring(0, 50) + '...'
                    : (item.shortDescription || item.description || '')}
                </AppText>
              </View>
            )}

            <View style={sItem.priceRow}>
              <AppText style={sItem.priceMain}>{fmtVND(price)}</AppText>
              {pct > 0 && (
                <AppText variant="caption" style={sItem.priceOld}>
                  {fmtVND(item.price)}
                </AppText>
              )}
            </View>

            {/* Bộ điều khiển số lượng */}
            <View style={sItem.actionsRow}>
              <QtyStepper
                value={item.quantity}
                onDecrease={() =>
                  item.quantity > 1
                    ? onQuantityChange(item, item.quantity - 1)
                    : onRemove(item)
                }
                onIncrease={() => onQuantityChange(item, item.quantity + 1)}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Styles
const sItem = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BTN_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.borderRadius.md,
  },
  deleteTouch: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 12,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    position: 'relative',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saleBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomRightRadius: Spacing.borderRadius.sm,
  },
  saleBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 9 },
  info: { flex: 1, gap: 4 },
  catalogRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  catalogText: { color: Colors.neutral[400], fontSize: 11 },
  name: { lineHeight: 18 },
  variationTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
    borderWidth: 0.5,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  priceMain: { fontSize: 15, fontWeight: '700', color: MEKO_RED },
  priceOld: { textDecorationLine: 'line-through', color: Colors.neutral[400], fontSize: 12 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
});


// ─── Coupon Section ─────────────────────────────────────────────────────────

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
  const [focused, setFocused] = useState(false);

  if (appliedCoupon) {
    return (
      <View style={[sCoupon.appliedWrap, { backgroundColor: c.bg }]}>
        <View style={sCoupon.appliedLeft}>
          <View style={sCoupon.iconCircle}>
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
    <View style={[sCoupon.wrap, { backgroundColor: c.bg }]}>
      <Ionicons name="pricetag-outline" size={18} color={MEKO_RED} />
      <TextInput
        style={[sCoupon.input, { color: c.text }]}
        placeholder="Nhập mã giảm giá"
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
        style={[sCoupon.applyBtn, { opacity: code.trim() ? 1 : 0.4 }]}
        onPress={() => {
          if (code.trim()) { onApply(code.trim()); setCode(''); }
        }}
        disabled={!code.trim()}
      >
        <AppText variant="caption" weight="600" style={{ color: MEKO_RED }}>Áp dụng</AppText>
      </TouchableOpacity>
    </View>
  );
}
const sCoupon = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: Colors.neutral[100] },
  input: { flex: 1, fontSize: 13, paddingVertical: 0 },
  applyBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: MEKO_RED, borderRadius: Spacing.borderRadius.sm },
  appliedWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: Colors.neutral[100] },
  appliedLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center' },
});

// ─── Platform Voucher ───────────────────────────────────────────────────────

function PlatformVoucher() {
  const { c } = useTheme();
  return (
    <TouchableOpacity style={[sPV.wrap, { backgroundColor: c.bg }]} activeOpacity={0.7}>
      <View style={sPV.left}>
        <Ionicons name="gift-outline" size={18} color={MEKO_RED} />
        <View>
          <AppText variant="body2" weight="600">Voucher MekoEdu</AppText>
          <AppText variant="caption" color="textSub">Chọn mã để được giảm thêm</AppText>
        </View>
      </View>
      <View style={sPV.right}>
        <AppText variant="caption" style={{ color: MEKO_RED }}>Chọn mã</AppText>
        <Ionicons name="chevron-forward" size={14} color={MEKO_RED} />
      </View>
    </TouchableOpacity>
  );
}
const sPV = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, marginTop: Spacing.sm },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

// ─── Order Summary ──────────────────────────────────────────────────────────

function OrderSummaryCard() {
  const { c } = useTheme();
  const selectedItems = useSelector(selectSelectedItems);
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const finalTotal = useSelector(selectFinalTotal);

  const subtotal = selectedItems.reduce((s, i) => s + effectivePrice(i) * i.quantity, 0);
  const originalTotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const savedPromo = originalTotal - subtotal;
  const savedCoupon = subtotal - finalTotal;

  if (selectedItems.length === 0) return null;

  return (
    <View style={[sOS.wrap, { backgroundColor: c.bg }]}>
      <AppText variant="body2" weight="600" style={sOS.title}>Chi tiết thanh toán</AppText>

      <View style={sOS.row}>
        <AppText variant="caption" color="textSub">Tạm tính</AppText>
        <AppText variant="caption">{fmtVND(originalTotal)}</AppText>
      </View>

      {savedPromo > 0 && (
        <View style={sOS.row}>
          <AppText variant="caption" color="textSub">Giảm giá sản phẩm</AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>-{fmtVND(savedPromo)}</AppText>
        </View>
      )}

      {savedCoupon > 0 && appliedCoupon && (
        <View style={sOS.row}>
          <AppText variant="caption" color="textSub">Mã {appliedCoupon.code}</AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>-{fmtVND(savedCoupon)}</AppText>
        </View>
      )}

      <View style={[sOS.row, sOS.totalRow]}>
        <AppText variant="body2" weight="600">Tổng tiền</AppText>
        <AppText style={sOS.totalAmt}>{fmtVND(finalTotal)}</AppText>
      </View>

      {(savedPromo + savedCoupon) > 0 && (
        <View style={sOS.savingsBar}>
          <Ionicons name="happy-outline" size={14} color={MEKO_RED} />
          <AppText variant="caption" style={{ color: MEKO_RED, marginLeft: 4 }}>
            Bạn tiết kiệm được {fmtVND(savedPromo + savedCoupon)} cho đơn hàng này
          </AppText>
        </View>
      )}
    </View>
  );
}
const sOS = StyleSheet.create({
  wrap: { marginTop: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 14, gap: 8 },
  title: { marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalRow: { paddingTop: 8, borderTopWidth: 0.5, borderTopColor: Colors.neutral[100], marginTop: 4 },
  totalAmt: { fontSize: 16, fontWeight: '700', color: MEKO_RED },
  savingsBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary[50], paddingHorizontal: 10, paddingVertical: 6, borderRadius: Spacing.borderRadius.sm, marginTop: 4 },
});

// ─── Empty Cart ─────────────────────────────────────────────────────────────

function EmptyCart() {
  const { c } = useTheme();
  return (
    <View style={sEmpty.wrap}>
      <View style={sEmpty.iconCircle}>
        <Ionicons name="cart-outline" size={56} color={Colors.primary[300]} />
      </View>
      <AppText variant="h4" weight="600" style={sEmpty.title}>Giỏ hàng trống</AppText>
      <AppText variant="body2" color="textSub" style={sEmpty.sub}>
        Thêm khoá học vào giỏ để bắt đầu hành trình học tập nhé!
      </AppText>
      <TouchableOpacity
        style={sEmpty.btn}
        onPress={() => router.push('/(tabs)/courses')}
        activeOpacity={0.85}
      >
        <AppText variant="body2" weight="700" style={{ color: '#fff' }}>Khám phá khoá học</AppText>
      </TouchableOpacity>
    </View>
  );
}
const sEmpty = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { textAlign: 'center' },
  sub: { textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, backgroundColor: MEKO_RED, paddingHorizontal: 28, paddingVertical: 12, borderRadius: Spacing.borderRadius.md },
});

// ─── Checkout Bar ───────────────────────────────────────────────────────────

function CheckoutBar({
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
  const selectedItems = useSelector(selectSelectedItems);
  const finalTotal = useSelector(selectFinalTotal);
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <View style={[sBar.wrap, { backgroundColor: c.bg, paddingBottom: insets.bottom + 4, borderTopColor: c.border }]}>
      {/* Select all */}
      <View style={sBar.left}>
        <SCheckbox checked={isAllSelected} onPress={onToggleAll} size={22} />
        <AppText variant="caption" style={sBar.allLabel}>Tất cả</AppText>
      </View>

      {/* Total + checkout */}
      <View style={sBar.right}>
        <View style={sBar.totalCol}>
          <View style={sBar.totalRow}>
            <AppText variant="caption" color="textSub">Tổng: </AppText>
            <AppText style={sBar.totalAmt}>{fmtVND(finalTotal)}</AppText>
          </View>
          {selectedCount > 0 && (
            <AppText variant="caption" color="textSub" style={sBar.savingsHint}>
              Đã chọn {selectedCount} khoá học
            </AppText>
          )}
        </View>

        <TouchableOpacity
          style={[sBar.checkoutBtn, { opacity: selectedCount === 0 ? 0.5 : 1 }]}
          onPress={onCheckout}
          disabled={selectedCount === 0}
          activeOpacity={0.85}
        >
          <AppText variant="body2" weight="700" style={{ color: '#fff', letterSpacing: 0.3 }}>
            Mua hàng{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}
const sBar = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 10, borderTopWidth: 0.5, gap: 8 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  allLabel: { fontSize: 12 },
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  totalCol: { alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline' },
  totalAmt: { fontSize: 16, fontWeight: '700', color: MEKO_RED },
  savingsHint: { fontSize: 10 },
  checkoutBtn: { backgroundColor: MEKO_RED, paddingHorizontal: 18, paddingVertical: 10, borderRadius: Spacing.borderRadius.sm },
});

// ─── Header ─────────────────────────────────────────────────────────────────

function CartHeader({
  itemCount,
  onClear,
}: {
  itemCount: number;
  onClear: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[sHeader.wrap, { paddingTop: insets.top + 4 }]}>
      <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <AppText variant="body1" weight="600" style={sHeader.title}>
        Giỏ hàng {itemCount > 0 ? `(${itemCount})` : ''}
      </AppText>
      {itemCount > 0 ? (
        <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <AppText variant="caption" style={sHeader.clearBtn}>Xoá tất cả</AppText>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 56 }} />
      )}
    </View>
  );
}
const sHeader = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: MEKO_RED, paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 12 },
  title: { flex: 1, color: '#fff', fontSize: 17 },
  clearBtn: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
});

// ─── Separator ──────────────────────────────────────────────────────────────

function SectionSep() {
  return <View style={{ height: Spacing.sm, backgroundColor: Colors.background.tertiary }} />;
}

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function CartScreen() {
  const dispatch = useDispatch();
  const { spacing } = useTheme();

  const cartItems = useSelector(selectCartItems);
  const selectedIds = useSelector(selectSelectedIds);
  const cartId = useSelector(selectCartId);
  const accountId = useSelector(selectAccountId) as number;
  const appliedCoupon = useSelector(selectAppliedCoupon);
  const syncing = useSelector(selectCartSyncing);
  const isAllSelected = useSelector(selectIsAllSelected);

  const { loadCartFromServer, updateQuantityAsync, removeItemAsync } = useCartSync();

  const [localLoading, setLocalLoading] = useState(false);
  const isLoading = syncing || localLoading;

  useEffect(() => {
    loadCartFromServer();
  }, []);

  // Handlers
  const handleToggleSelect = useCallback(
    (id: string | number) => dispatch(toggleSelectItem(id)),
    [dispatch],
  );

  const handleToggleAll = useCallback(
    () => (isAllSelected ? dispatch(deselectAllItems()) : dispatch(selectAllItems())),
    [dispatch, isAllSelected],
  );

  const handleRemove = useCallback(
    (item: CartItem) => {
      Alert.alert('Xoá khoá học', `Xoá "${item.name}" khỏi giỏ hàng?`, [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: () => removeItemAsync(item.id, item.cartItemId),
        },
      ]);
    },
    [removeItemAsync],
  );

  const handleQtyChange = useCallback(
    (item: CartItem, qty: number) => updateQuantityAsync(item.id, item.cartItemId, qty),
    [updateQuantityAsync],
  );

  const handleClearCart = useCallback(() => {
    Alert.alert('Xoá giỏ hàng', 'Xoá toàn bộ khoá học trong giỏ?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá tất cả',
        style: 'destructive',
        onPress: async () => {
          if (!cartId) return;
          setLocalLoading(true);
          await clearCartAPI(cartId);
          dispatch(clearCart());
          setLocalLoading(false);
        },
      },
    ]);
  }, [dispatch, cartId]);

  const handleApplyCoupon = useCallback(
    async (code: string) => {
      if (!cartId) return;
      setLocalLoading(true);
      const updatedCart = await applyCouponAPI(cartId, code);
      if (updatedCart) {
        dispatch(
          reduxApplyCoupon({
            code: code.toUpperCase(),
            discountType: 'fixed',
            discountValue: updatedCart.discountTotal ?? 0,
          }),
        );
        Alert.alert('✓ Áp dụng thành công', `Mã ${code.toUpperCase()} đã được áp dụng.`);
      } else {
        Alert.alert('Mã không hợp lệ', 'Vui lòng kiểm tra lại mã giảm giá.');
      }
      setLocalLoading(false);
    },
    [dispatch, cartId],
  );

  const handleRemoveCoupon = useCallback(async () => {
    if (!cartId) return;
    setLocalLoading(true);
    const ok = await removeCouponAPI(cartId);
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

  // Group items by shop (catalogName)
  const shopGroups = useMemo(() => {
    const map = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const key = item.catalogName ?? 'MekoEdu';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [cartItems]);

  type ListRow =
    | { type: 'shopHeader'; shopName: string }
    | { type: 'item'; item: CartItem }
    | { type: 'shopCoupon'; shopName: string }
    | { type: 'sep' }
    | { type: 'platformVoucher' }
    | { type: 'summary' };

  const listData: ListRow[] = useMemo(() => {
    const rows: ListRow[] = [];
    shopGroups.forEach(([shopName, items], idx) => {
      rows.push({ type: 'shopHeader', shopName });
      items.forEach((item) => rows.push({ type: 'item', item }));
      rows.push({ type: 'shopCoupon', shopName });
      if (idx < shopGroups.length - 1) rows.push({ type: 'sep' });
    });
    rows.push({ type: 'sep' });
    rows.push({ type: 'platformVoucher' });
    rows.push({ type: 'sep' });
    rows.push({ type: 'summary' });
    return rows;
  }, [shopGroups]);

  const shopAllChecked = useCallback(
    (items: CartItem[]) => items.every((i) => selectedIds.includes(i.id)),
    [selectedIds],
  );

  const toggleShopAll = useCallback(
    (items: CartItem[]) => {
      const allChecked = items.every((i) => selectedIds.includes(i.id));
      items.forEach((i) => {
        const isSelected = selectedIds.includes(i.id);
        if (allChecked && isSelected) dispatch(toggleSelectItem(i.id));
        if (!allChecked && !isSelected) dispatch(toggleSelectItem(i.id));
      });
    },
    [dispatch, selectedIds],
  );

  const renderRow = useCallback(
    ({ item: row }: { item: ListRow }) => {
      if (row.type === 'sep') return <SectionSep />;
      if (row.type === 'platformVoucher') return (
        <>
          <PlatformVoucher />
          <CouponSection
            appliedCoupon={appliedCoupon}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
          />
        </>
      );
      if (row.type === 'summary') return <OrderSummaryCard />;

      if (row.type === 'shopHeader') {
        const shopItems = shopGroups.find(([n]) => n === row.shopName)?.[1] ?? [];
        return (
          <ShopHeader
            shopName={row.shopName}
            allChecked={shopAllChecked(shopItems)}
            onToggleAll={() => toggleShopAll(shopItems)}
          />
        );
      }
      if (row.type === 'shopCoupon') return null;

      if (row.type === 'item') {
        return (
          <>
            <CartItemCard
              item={row.item}
              selected={selectedIds.includes(row.item.id)}
              onToggleSelect={handleToggleSelect}
              onRemove={handleRemove}
              onQuantityChange={handleQtyChange}
            />
            <View style={{ height: 0.5, backgroundColor: Colors.neutral[100], marginLeft: THUMB_SIZE + 10 + Spacing.md + 22 + 10 }} />
          </>
        );
      }
      return null;
    },
    [selectedIds, shopGroups, appliedCoupon, shopAllChecked, toggleShopAll, handleToggleSelect, handleRemove, handleQtyChange, handleApplyCoupon, handleRemoveCoupon],
  );

  // ─── Render ────────────────────────────────────────────────────────────────

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
            keyExtractor={(row, idx) => {
              if (row.type === 'item') return `item-${row.item.id}`;
              if (row.type === 'shopHeader') return `shopH-${row.shopName}`;
              return `${row.type}-${idx}`;
            }}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={Platform.OS === 'android'}
          />
          <CheckoutBar
            onCheckout={handleCheckout}
            isAllSelected={isAllSelected}
            onToggleAll={handleToggleAll}
          />
        </>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: Spacing['3xl'],
  },
});
