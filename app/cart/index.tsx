// app/cart/index.tsx
import {
  AppButton,
  AppCard,
  AppDivider,
  AppHeader,
  AppText
} from "@/src/components/common";
import {
  clearCart,
  removeFromCart,
  selectCartCount,
  selectCartItems,
  selectCartSavings,
  selectCartTotal,
  updateQuantity
} from "@/src/store/slices/cartSlice";
import { Colors, Spacing, useTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import {
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string | number;
  name: string;
  thumbnail?: string;
  price: number;
  promoPrice?: number;
  catalogName?: string;
  quantity: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const getEffectivePrice = (item: CartItem) =>
  item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
    ? item.promoPrice
    : item.price;

// ─── Subcomponents ────────────────────────────────────────────────────────────

function CartItemCard({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  onRemove: (id: string | number) => void;
  onQuantityChange: (id: string | number, qty: number) => void;
}) {
  const { c } = useTheme();
  const effectivePrice = getEffectivePrice(item);
  const hasDiscount =
    item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price;
  const discountPct = hasDiscount
    ? Math.round((1 - item.promoPrice! / item.price) * 100)
    : 0;

  return (
    <AppCard style={styles.itemCard} padding="md">
      <View style={styles.itemContent}>
        {/* Thumbnail */}
        <View style={styles.itemThumb}>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumbImage}
              resizeMode="cover"
            />
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
            <AppText variant="caption" color="primary" style={styles.itemBrand}>
              {item.catalogName}
            </AppText>
          )}
          <AppText variant="body2" weight="600" numberOfLines={2} style={styles.itemName}>
            {item.name}
          </AppText>

          <View style={styles.itemPriceRow}>
            <AppText variant="body1" weight="700" color="primary">
              {fmtVND(effectivePrice)}
            </AppText>
            {hasDiscount && (
              <AppText variant="caption" color="textSub" style={styles.itemOriginalPrice}>
                {fmtVND(item.price)}
              </AppText>
            )}
          </View>

          {/* Quantity + Remove */}
          <View style={styles.itemActions}>
            <View style={[styles.qtyControl, { borderColor: c.border }]}>
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: c.bgSoft }]}
                onPress={() =>
                  item.quantity > 1
                    ? onQuantityChange(item.id, item.quantity - 1)
                    : onRemove(item.id)
                }
                hitSlop={{ top: Spacing.sm, bottom: Spacing.sm, left: Spacing.sm, right: Spacing.sm }}
              >
                <AppText style={styles.qtyBtnText}>−</AppText>
              </TouchableOpacity>
              
              <AppText variant="body2" weight="600" style={styles.qtyValue}>
                {item.quantity}
              </AppText>
              
              <TouchableOpacity
                style={[styles.qtyBtn, { backgroundColor: c.bgSoft }]}
                onPress={() => onQuantityChange(item.id, item.quantity + 1)}
                hitSlop={{ top: Spacing.sm, bottom: Spacing.sm, left: Spacing.sm, right: Spacing.sm }}
              >
                <AppText style={styles.qtyBtnText}>+</AppText>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => onRemove(item.id)}
              hitSlop={{ top: Spacing.sm, bottom: Spacing.sm, left: Spacing.sm, right: Spacing.sm }}
            >
              <AppText variant="caption" color="error" weight="600">
                Xóa
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </AppCard>
  );
}

function OrderSummary({
  items,
  onCheckout,
}: {
  items: CartItem[];
  onCheckout: () => void;
}) {
  const { c } = useTheme();
  const subtotal = items.reduce(
    (sum, item) => sum + getEffectivePrice(item) * item.quantity,
    0
  );
  const originalTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const saved = originalTotal - subtotal;

  return (
    <AppCard style={styles.summaryCard} padding="lg">
      <AppText variant="h4" weight="600" style={styles.summaryTitle}>
        Tóm tắt đơn hàng
      </AppText>

      <View style={styles.summaryRow}>
        <AppText variant="body2" color="textSub">
          Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} khóa học)
        </AppText>
        <AppText variant="body2" weight="500">
          {fmtVND(originalTotal)}
        </AppText>
      </View>

      {saved > 0 && (
        <View style={styles.summaryRow}>
          <AppText variant="body2" color="success" weight="500">
            Tiết kiệm
          </AppText>
          <AppText variant="body2" color="success" weight="600">
            -{fmtVND(saved)}
          </AppText>
        </View>
      )}

      <AppDivider style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <AppText variant="body1" weight="700">
          Tổng cộng
        </AppText>
        <AppText variant="h3" weight="700" color="primary">
          {fmtVND(subtotal)}
        </AppText>
      </View>

      <AppButton
        title="Thanh toán ngay"
        onPress={onCheckout}
        variant="primary"
        size="large"
        style={styles.checkoutBtn}
      />

      <AppButton
        title="Tiếp tục mua sắm"
        onPress={() => router.push("/(tabs)/courses")}
        variant="outline"
        size="medium"
        style={styles.continueBtn}
      />
    </AppCard>
  );
}

function EmptyCart() {
  const { c } = useTheme();
  
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={80} color={c.textSub} />
      </View>
      <AppText variant="h3" style={styles.emptyTitle}>
        Giỏ hàng trống
      </AppText>
      <AppText variant="body2" color="textSub" style={styles.emptyDesc}>
        Bạn chưa thêm khóa học nào vào giỏ hàng.
      </AppText>
      <AppButton
        title="Khám phá khóa học"
        onPress={() => router.push("/(tabs)/courses")}
        variant="primary"
        size="large"
        style={styles.emptyAction}
      />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CartScreen() {
  const dispatch = useDispatch();
  const { c } = useTheme();
  const cartItems = useSelector(selectCartItems);
  const cartCount = useSelector(selectCartCount);
  const cartTotal = useSelector(selectCartTotal);
  const cartSavings = useSelector(selectCartSavings);

  const handleRemove = useCallback(
    (id: string | number) => {
      Alert.alert("Xóa khóa học", "Bạn có chắc muốn xóa khóa học này?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => dispatch(removeFromCart(id)),
        },
      ]);
    },
    [dispatch]
  );

  const handleQtyChange = useCallback(
    (id: string | number, qty: number) => {
      dispatch(updateQuantity({ id, quantity: qty }));
    },
    [dispatch]
  );

  const handleClearCart = useCallback(() => {
    Alert.alert("Xóa giỏ hàng", "Bạn có chắc muốn xóa toàn bộ giỏ hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa tất cả",
        style: "destructive",
        onPress: () => dispatch(clearCart()),
      },
    ]);
  }, [dispatch]);

  const handleCheckout = useCallback(() => {
    router.push("/cart/checkout");
  }, []);

  const isEmpty = cartItems.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background.secondary }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.primary}
      />
      <AppHeader
        title="Giỏ hàng"
        showBack={true}
        showCart={true}
        rightAction={
          !isEmpty
            ? { label: "Xóa tất cả", onPress: handleClearCart }
            : undefined
        }
      />

      {isEmpty ? (
        <EmptyCart />
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CartItemCard
              item={item}
              onRemove={handleRemove}
              onQuantityChange={handleQtyChange}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            <OrderSummary items={cartItems} onCheckout={handleCheckout} />
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const THUMB_SIZE = 88;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.layout.screenHorizontal,
    paddingBottom: Spacing["3xl"],
  },
  separator: {
    height: Spacing.md,
  },

  // ── Item card ────────────────────────────────────────────────
  itemCard: {
    marginBottom: Spacing[0],
  },
  itemContent: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  itemThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.borderRadius.md,
    overflow: "hidden",
    position: "relative",
  },
  thumbImage: { 
    width: "100%", 
    height: "100%" 
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute",
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Spacing.borderRadius.sm,
  },
  discountBadgeText: {
    color: Colors.neutral[0],
    fontWeight: "bold",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "space-between",
  },
  itemBrand: {
    marginBottom: 2,
    textTransform: "uppercase",
  },
  itemName: {
    marginBottom: Spacing.xs,
  },
  itemPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  itemOriginalPrice: {
    textDecorationLine: "line-through",
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: Spacing.borderWidth.normal,
    borderRadius: Spacing.borderRadius.md,
    overflow: "hidden",
  },
  qtyBtn: {
    width: Spacing[7],
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBtnText: {
    fontSize: 16,
    fontWeight: "500",
  },
  qtyValue: {
    minWidth: Spacing[7],
    textAlign: "center",
  },
  removeBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },

  // ── Summary card ─────────────────────────────────────────────
  summaryCard: {
    marginTop: Spacing.md,
  },
  summaryTitle: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  summaryDivider: {
    marginVertical: Spacing.md,
  },
  checkoutBtn: {
    marginTop: Spacing.lg,
  },
  continueBtn: {
    marginTop: Spacing.md,
  },

  // ── Empty state ───────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDesc: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  emptyAction: {
    minWidth: 200,
  },
});
