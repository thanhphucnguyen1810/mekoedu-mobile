// app/cart/index.tsx
import { AppHeader, AppText } from "@/src/components/common";
import cartServiceApi from "@/src/services/cartService";
import storeConfigService from "@/src/services/storeConfigService";
import userService from "@/src/services/userService";
import {
  clearCart,
  removeFromCart,
  setCartItems as setReduxCartItems,
  updateCartQuantity,
} from "@/src/store/slices/cartSlice";
import { Colors, useTheme } from "@/src/theme";
import { ENV } from "@/src/types/env";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";

interface CartItem {
  id: number;
  productId: number;
  skuId: number;
  name: string;
  thumbnail?: string;
  price: number;
  promoPrice?: number;
  quantity: number;
  catalogName?: string;
}

const MEKO_RED = Colors.primary[500];
const THUMB_SIZE = 88;

const fmtVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const effectivePrice = (item: CartItem) =>
  item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
    ? item.promoPrice
    : item.price;

const discountPct = (item: CartItem) =>
  item.promoPrice && item.promoPrice < item.price
    ? Math.round((1 - item.promoPrice / item.price) * 100)
    : 0;

const normalizeImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${ENV.API_URL}${url}`;
};

function mapLiferayCartItem(item: any): CartItem {
  const priceObj = typeof item.price === "object" ? item.price : null;

  const price = priceObj
    ? (priceObj.price ?? priceObj.finalPrice ?? priceObj.unitPrice ?? 0)
    : (item.price ?? item.finalPrice ?? 0);

  const promoPrice = priceObj
    ? (priceObj.promoPrice ?? priceObj.discountedPrice ?? undefined)
    : item.promoPrice;

  return {
    id: item.id,
    productId: item.productId || item.product?.id || item.id,
    skuId: item.skuId || item.sku?.id || item.id,
    name: item.name || item.productName || item.product?.name || "Sản phẩm",
    thumbnail:
      item.thumbnail ||
      item.imageUrl ||
      item.image ||
      item.product?.thumbnail ||
      item.product?.image,
    price,
    promoPrice,
    quantity: item.quantity || 1,
    catalogName: item.catalogName || item.product?.catalogName || "MekoEdu",
  };
}

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
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <Animated.View
        style={[
          styles.checkbox,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: checked ? MEKO_RED : "transparent",
            borderColor: checked ? MEKO_RED : Colors.neutral[300],
            transform: [{ scale }],
          },
        ]}
      >
        {checked ? (
          <Ionicons name="checkmark" size={size * 0.6} color="#fff" />
        ) : null}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

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
    <View style={[styles.stepper, { borderColor: c.border }]}>
      <TouchableOpacity
        style={[styles.stepperBtn, { backgroundColor: c.bgSoft }]}
        onPress={onDecrease}
      >
        <Ionicons name="remove" size={14} color={c.text} />
      </TouchableOpacity>

      <View style={[styles.stepperValueWrap, { borderColor: c.border }]}>
        <AppText variant="body2" weight="600" style={styles.stepperValue}>
          {value}
        </AppText>
      </View>

      <TouchableOpacity
        style={[styles.stepperBtn, { backgroundColor: c.bgSoft }]}
        onPress={onIncrease}
      >
        <Ionicons name="add" size={14} color={c.text} />
      </TouchableOpacity>
    </View>
  );
}

function ShopHeader({
  shopName,
  allChecked,
  onToggleAll,
}: {
  shopName: string;
  allChecked: boolean;
  onToggleAll: () => void;
}) {
  const { c, spacing } = useTheme();

  return (
    <View
      style={[
        styles.shopHeader,
        {
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          borderBottomColor: c.border,
          gap: spacing.sm,
          backgroundColor: c.bg,
        },
      ]}
    >
      <SCheckbox checked={allChecked} onPress={onToggleAll} size={20} />
      <Ionicons name="storefront-outline" size={16} color={MEKO_RED} />

      <AppText variant="body2" weight="600" style={{ flex: 1 }}>
        {shopName}
      </AppText>

      <TouchableOpacity style={styles.voucherBtn}>
        <Ionicons name="pricetag-outline" size={13} color={MEKO_RED} />
        <AppText variant="caption" color="primary" style={{ marginLeft: 3 }}>
          Voucher Shop
        </AppText>
        <Ionicons name="chevron-forward" size={12} color={MEKO_RED} />
      </TouchableOpacity>
    </View>
  );
}

function CartItemCard({
  item,
  selected,
  onToggleSelect,
  onRemove,
  onQuantityChange,
}: {
  item: CartItem;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onRemove: (item: CartItem) => void;
  onQuantityChange: (item: CartItem, qty: number) => void;
}) {
  const { c, spacing } = useTheme();
  const price = effectivePrice(item);
  const pct = discountPct(item);
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) pan.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -80) {
          Animated.timing(pan, {
            toValue: -180,
            duration: 180,
            useNativeDriver: false,
          }).start(() => onRemove(item));
        } else {
          Animated.spring(pan, {
            toValue: 0,
            useNativeDriver: false,
            friction: 5,
            tension: 40,
          }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.itemWrapper}>
      <View style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color="#fff" />
        <AppText style={styles.deleteText}>Xoá</AppText>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.itemCard,
          {
            backgroundColor: c.bg,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.sm,
            transform: [{ translateX: pan }],
          },
        ]}
      >
        <View style={[styles.itemRow, { gap: spacing.sm }]}>
          <SCheckbox
            checked={selected}
            onPress={() => onToggleSelect(item.id)}
            size={22}
          />

          <View style={styles.thumbWrap}>
            {item.thumbnail ? (
              <Image
                source={{ uri: normalizeImageUrl(item.thumbnail) }}
                style={styles.thumb}
              />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Ionicons name="book-outline" size={28} color={MEKO_RED} />
              </View>
            )}

            {pct > 0 ? (
              <View style={styles.saleBadge}>
                <AppText variant="overline" style={styles.saleBadgeText}>
                  -{pct}%
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={[styles.itemInfo, { gap: 4 }]}>
            {item.catalogName ? (
              <View style={styles.catalogRow}>
                <Ionicons
                  name="storefront-outline"
                  size={11}
                  color={Colors.neutral[400]}
                />
                <AppText variant="caption" style={styles.catalogText}>
                  {item.catalogName}
                </AppText>
              </View>
            ) : null}

            <AppText
              variant="body2"
              weight="500"
              numberOfLines={2}
              style={styles.itemName}
            >
              {item.name}
            </AppText>

            <View style={styles.priceRow}>
              <AppText style={styles.priceMain}>{fmtVND(price)}</AppText>
              {pct > 0 ? (
                <AppText variant="caption" style={styles.priceOld}>
                  {fmtVND(item.price)}
                </AppText>
              ) : null}
            </View>

            <View style={styles.actionsRow}>
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

function PlatformVoucher() {
  const { c, spacing } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.platformVoucher,
        {
          backgroundColor: c.bg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          marginTop: spacing.sm,
        },
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.platformLeft, { gap: spacing.sm }]}>
        <Ionicons name="gift-outline" size={18} color={MEKO_RED} />
        <View>
          <AppText variant="body2" weight="600">
            Voucher MekoEdu
          </AppText>
          <AppText variant="caption" color="textSub">
            Chọn mã để được giảm thêm
          </AppText>
        </View>
      </View>

      <View style={styles.platformRight}>
        <AppText variant="caption" style={{ color: MEKO_RED }}>
          Chọn mã
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={MEKO_RED} />
      </View>
    </TouchableOpacity>
  );
}

function CouponSection() {
  const { c, spacing } = useTheme();
  const [code, setCode] = useState("");

  return (
    <View
      style={[
        styles.couponWrap,
        {
          backgroundColor: c.bg,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          borderTopColor: c.border,
          gap: spacing.sm,
        },
      ]}
    >
      <Ionicons name="pricetag-outline" size={18} color={MEKO_RED} />

      <TextInput
        style={[styles.couponInput, { color: c.text }]}
        placeholder="Nhập mã giảm giá"
        placeholderTextColor={Colors.neutral[400]}
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
      />

      <TouchableOpacity
        style={[styles.applyBtn, { opacity: code.trim() ? 1 : 0.4 }]}
        disabled={!code.trim()}
        onPress={() => {
          Alert.alert("Thông báo", "Chức năng mã giảm giá sẽ xử lý sau.");
          setCode("");
        }}
      >
        <AppText variant="caption" weight="600" style={{ color: MEKO_RED }}>
          Áp dụng
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

function OrderSummaryCard({ selectedItems }: { selectedItems: CartItem[] }) {
  const { c, spacing } = useTheme();

  const originalTotal = selectedItems.reduce(
    (s, i) => s + i.price * i.quantity,
    0,
  );

  const finalTotal = selectedItems.reduce(
    (s, i) => s + effectivePrice(i) * i.quantity,
    0,
  );

  const saved = originalTotal - finalTotal;

  if (selectedItems.length === 0) return null;

  return (
    <View
      style={[
        {
          backgroundColor: c.bg,
          marginTop: spacing.sm,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          gap: spacing.sm,
        },
      ]}
    >
      <AppText variant="body2" weight="600">
        Chi tiết thanh toán
      </AppText>

      <View style={styles.summaryRow}>
        <AppText variant="caption" color="textSub">
          Tạm tính
        </AppText>
        <AppText variant="caption">{fmtVND(originalTotal)}</AppText>
      </View>

      {saved > 0 ? (
        <View style={styles.summaryRow}>
          <AppText variant="caption" color="textSub">
            Giảm giá sản phẩm
          </AppText>
          <AppText variant="caption" style={{ color: Colors.success }}>
            -{fmtVND(saved)}
          </AppText>
        </View>
      ) : null}

      <View style={[styles.summaryRow, { borderTopColor: c.border }]}>
        <AppText variant="body2" weight="600">
          Tổng tiền
        </AppText>
        <AppText style={styles.totalAmount}>{fmtVND(finalTotal)}</AppText>
      </View>
    </View>
  );
}

function CheckoutBar({
  selectedItems,
  isAllSelected,
  onToggleAll,
  onCheckout,
}: {
  selectedItems: CartItem[];
  isAllSelected: boolean;
  onToggleAll: () => void;
  onCheckout: () => void;
}) {
  const { c, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const total = selectedItems.reduce(
    (s, i) => s + effectivePrice(i) * i.quantity,
    0,
  );

  return (
    <View
      style={[
        styles.checkoutBar,
        {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          paddingHorizontal: spacing.sm,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          gap: spacing.sm,
        },
      ]}
    >
      <View style={styles.checkoutLeft}>
        <SCheckbox checked={isAllSelected} onPress={onToggleAll} size={22} />
        <AppText variant="caption">Tất cả</AppText>
      </View>

      <View style={[styles.checkoutRight, { gap: spacing.sm }]}>
        <View style={styles.totalCol}>
          <View style={styles.totalRow}>
            <AppText variant="caption" color="textSub">
              Tổng:
            </AppText>
            <AppText style={styles.totalAmount}>{fmtVND(total)}</AppText>
          </View>

          {selectedCount > 0 ? (
            <AppText variant="caption" color="textSub" style={{ fontSize: 10 }}>
              Đã chọn {selectedCount} khoá học
            </AppText>
          ) : null}
        </View>

        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            {
              opacity: selectedCount === 0 ? 0.5 : 1,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
            },
          ]}
          disabled={selectedCount === 0}
          onPress={onCheckout}
        >
          <AppText variant="body2" weight="700" style={{ color: "#fff" }}>
            Mua hàng{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyCart() {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        styles.emptyWrap,
        { paddingHorizontal: spacing.sm, gap: spacing.sm },
      ]}
    >
      <View style={styles.emptyIcon}>
        <Ionicons name="cart-outline" size={56} color={Colors.primary[300]} />
      </View>

      <AppText variant="h4" weight="600" style={styles.emptyTitle}>
        Giỏ hàng trống
      </AppText>

      <AppText variant="body2" color="textSub" style={styles.emptySub}>
        Thêm khoá học vào giỏ để bắt đầu hành trình học tập nhé!
      </AppText>

      <TouchableOpacity
        style={[styles.emptyBtn, { marginTop: spacing.sm }]}
        onPress={() => router.push("/(tabs)/courses")}
      >
        <AppText variant="body2" weight="700" style={{ color: "#fff" }}>
          Khám phá khoá học
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

function SectionSep() {
  const { spacing } = useTheme();

  return (
    <View
      style={{
        height: spacing.sm,
        backgroundColor: Colors.background.tertiary,
      }}
    />
  );
}

export default function CartScreen() {
  const { spacing } = useTheme();
  const dispatch = useDispatch();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const syncReduxCart = useCallback(
    (items: CartItem[]) => {
      dispatch(
        setReduxCartItems(
          items.map((item) => ({
            id: item.id,
            productId: item.productId,
            skuId: item.skuId,
            name: item.name,
            thumbnail: item.thumbnail,
            price: effectivePrice(item),
            quantity: item.quantity,
          })),
        ),
      );
    },
    [dispatch],
  );

  const selectedItems = useMemo(
    () => cartItems.filter((item) => selectedIds.includes(item.id)),
    [cartItems, selectedIds],
  );

  const isAllSelected =
    cartItems.length > 0 &&
    cartItems.every((item) => selectedIds.includes(item.id));

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);

      const accountId = await userService.getCurrentAccountId();

      if (!accountId) {
        setCartItems([]);
        setSelectedIds([]);
        dispatch(clearCart());
        return;
      }

      const config = await storeConfigService.getStoreConfig();
      const channelId = Number(config.channelId);

      const cart = await cartServiceApi.getOrCreateCart(accountId, channelId);

      if (!cart?.id) {
        setCartItems([]);
        setSelectedIds([]);
        dispatch(clearCart());
        return;
      }

      const itemsData = await cartServiceApi.getCartItems(cart.id);
      const items = (itemsData.items ?? []).map(mapLiferayCartItem);

      setCartItems(items);
      setSelectedIds(items.map((item) => item.id));
      syncReduxCart(items);
    } catch (error: any) {
      console.log("Load cart error:", error.response?.data || error.message);
      Alert.alert("Lỗi", "Không thể tải giỏ hàng");
    } finally {
      setLoading(false);
    }
  }, [dispatch, syncReduxCart]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleToggleAll = () => {
    setSelectedIds(isAllSelected ? [] : cartItems.map((item) => item.id));
  };

  const handleRemove = (item: CartItem) => {
    Alert.alert("Xoá khoá học", `Xoá "${item.name}" khỏi giỏ hàng?`, [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          const oldItems = cartItems;
          const oldSelectedIds = selectedIds;

          try {
            const nextItems = cartItems.filter((i) => i.id !== item.id);
            const nextSelectedIds = selectedIds.filter((id) => id !== item.id);

            setCartItems(nextItems);
            setSelectedIds(nextSelectedIds);

            dispatch(
              removeFromCart({
                productId: item.productId,
                skuId: item.skuId,
              }),
            );

            await cartServiceApi.deleteCartItem(item.id);
          } catch (error: any) {
            console.log("Delete error:", error.response?.data || error.message);
            setCartItems(oldItems);
            setSelectedIds(oldSelectedIds);
            syncReduxCart(oldItems);
            loadCart();
          }
        },
      },
    ]);
  };

  const handleQtyChange = async (item: CartItem, qty: number) => {
    const oldItems = cartItems;

    try {
      const nextItems = cartItems.map((i) =>
        i.id === item.id ? { ...i, quantity: qty } : i,
      );

      setCartItems(nextItems);

      dispatch(
        updateCartQuantity({
          productId: item.productId,
          skuId: item.skuId,
          quantity: qty,
        }),
      );

      await cartServiceApi.updateCartItem(item.id, qty);
    } catch (error: any) {
      console.log("Update qty error:", error.response?.data || error.message);
      setCartItems(oldItems);
      syncReduxCart(oldItems);
      loadCart();
    }
  };

  const handleClear = () => {
    Alert.alert("Xoá giỏ hàng", "Xoá toàn bộ khoá học trong giỏ?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá tất cả",
        style: "destructive",
        onPress: async () => {
          const oldItems = cartItems;
          const oldSelectedIds = selectedIds;

          try {
            setCartItems([]);
            setSelectedIds([]);
            dispatch(clearCart());

            await Promise.all(
              cartItems.map((item) => cartServiceApi.deleteCartItem(item.id)),
            );
          } catch (error: any) {
            console.log(
              "Clear cart error:",
              error.response?.data || error.message,
            );

            setCartItems(oldItems);
            setSelectedIds(oldSelectedIds);
            syncReduxCart(oldItems);
            loadCart();
          }
        },
      },
    ]);
  };

  const handleCheckout = () => {
    router.push("/cart/checkout");
  };

  const shopName = cartItems[0]?.catalogName ?? "MekoEdu";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <AppHeader
        showBack
        title={`Giỏ hàng${cartItems.length > 0 ? ` (${cartItems.length})` : ""}`}
      />

      {cartItems.length > 0 ? (
        <TouchableOpacity style={styles.clearTopBtn} onPress={handleClear}>
          <AppText variant="caption" color="primary">
            Xoá tất cả
          </AppText>
        </TouchableOpacity>
      ) : null}

      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={MEKO_RED} />
        </View>
      ) : cartItems.length === 0 ? (
        <EmptyCart />
      ) : (
        <>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={Platform.OS === "android"}
            contentContainerStyle={{
              paddingHorizontal: spacing.sm,
              paddingBottom: spacing["3xl"],
            }}
            ListHeaderComponent={
              <ShopHeader
                shopName={shopName}
                allChecked={isAllSelected}
                onToggleAll={handleToggleAll}
              />
            }
            ItemSeparatorComponent={() => (
              <View style={{ height: spacing.sm }} />
            )}
            renderItem={({ item }) => (
              <CartItemCard
                item={item}
                selected={selectedIds.includes(item.id)}
                onToggleSelect={handleToggleSelect}
                onRemove={handleRemove}
                onQuantityChange={handleQtyChange}
              />
            )}
            ListFooterComponent={
              <>
                <SectionSep />
                <PlatformVoucher />
                <CouponSection />
                <SectionSep />
                <OrderSummaryCard selectedItems={selectedItems} />
              </>
            }
          />

          <CheckoutBar
            selectedItems={selectedItems}
            isAllSelected={isAllSelected}
            onToggleAll={handleToggleAll}
            onCheckout={handleCheckout}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.tertiary,
  },
  clearTopBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.65)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  shopHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
  },
  voucherBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemWrapper: {
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.error,
    borderRadius: 12,
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
    marginTop: 4,
    fontSize: 12,
  },
  itemCard: {
    borderRadius: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumbWrap: {
    position: "relative",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary[50],
  },
  saleBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomRightRadius: 6,
  },
  saleBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 9,
  },
  itemInfo: {
    flex: 1,
  },
  catalogRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  catalogText: {
    color: Colors.neutral[400],
    fontSize: 11,
  },
  itemName: {
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  priceMain: {
    fontSize: 15,
    fontWeight: "700",
    color: MEKO_RED,
  },
  priceOld: {
    textDecorationLine: "line-through",
    color: Colors.neutral[400],
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepper: {
    flexDirection: "row",
    borderWidth: 0.5,
    borderRadius: 6,
    overflow: "hidden",
  },
  stepperBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValueWrap: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
  },
  stepperValue: {
    fontSize: 13,
  },
  platformVoucher: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  platformRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  couponWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
  },
  couponInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  applyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: MEKO_RED,
    borderRadius: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: MEKO_RED,
  },
  checkoutBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
  },
  checkoutLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkoutRight: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  totalCol: {
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  checkoutBtn: {
    backgroundColor: MEKO_RED,
    borderRadius: 6,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptySub: {
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: MEKO_RED,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
});
