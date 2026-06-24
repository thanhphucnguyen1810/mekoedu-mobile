import { AppText } from "@/src/components/common";
import { QtyStepper } from "@/src/components/common/QtyStepper";
import { CartItem } from "@/src/store/slices/cartSlice";
import { Colors, Spacing, useTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { DELETE_BTN_WIDTH, MEKO_RED, THUMB_SIZE } from "./cartConstants";
import { discountPct, effectivePrice, fmtVND } from "./cartHelpers";

type Props = {
  item: CartItem;
  onRemove: (item: CartItem) => void;
  onQuantityChange: (item: CartItem, qty: number) => void;
};

export function CartItemCard({ item, onRemove, onQuantityChange }: Props) {
  const { c } = useTheme();
  const price = effectivePrice(item);
  const pct = discountPct(item);
  const translateX = useRef(new Animated.Value(0)).current;
  const dragOffset = useRef(0);
  const isDeleting = useRef(false);

  const onRemoveRef = useRef(onRemove);
  const itemRef = useRef(item);
  useEffect(() => {
    onRemoveRef.current = onRemove;
    itemRef.current = item;
  });

  useEffect(() => {
    translateX.setValue(0);
    dragOffset.current = 0;
    isDeleting.current = false;
  }, [item.id]);

  // ── Animation helpers ──────────────────────────────────────────────────────

  const snapBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      dragOffset.current = 0;
    });
  }, [translateX]);

  const snapOpen = useCallback(() => {
    Animated.spring(translateX, {
      toValue: -DELETE_BTN_WIDTH,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      dragOffset.current = -DELETE_BTN_WIDTH;
    });
  }, [translateX]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const triggerDelete = useCallback(() => {
    if (isDeleting.current) return;
    isDeleting.current = true;
    Animated.timing(translateX, {
      toValue: -400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onRemoveRef.current(itemRef.current);
    });
  }, [translateX]);

  const triggerDeleteRef = useRef(triggerDelete);
  useEffect(() => {
    triggerDeleteRef.current = triggerDelete;
  });

  // ── PanResponder ───────────────────────────────────────────────────────────

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5 && !isDeleting.current,

      onPanResponderGrant: () => {
        translateX.stopAnimation();
      },

      onPanResponderMove: (_, g) => {
        if (isDeleting.current) return;
        const newOffset = Math.max(
          Math.min(0, g.dx + dragOffset.current),
          -DELETE_BTN_WIDTH
        );
        translateX.setValue(newOffset);
      },

      onPanResponderRelease: (_, g) => {
        if (isDeleting.current) return;
        const currentOffset = dragOffset.current + g.dx;
        if (currentOffset < -DELETE_BTN_WIDTH * 0.6) {
          // Kéo quá 60% → xóa luôn không cần nhấn nút
          triggerDeleteRef.current();
        } else if (currentOffset < -DELETE_BTN_WIDTH * 0.3) {
          // Kéo 30–60% → mở hé nút xóa
          snapOpen();
        } else {
          snapBack();
        }
      },

      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrapper}>
      {/* Nút xóa đỏ phía sau */}
      <View
        style={[
          styles.deleteButton,
          { backgroundColor: Colors.error, width: DELETE_BTN_WIDTH },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteTouch}
          onPress={triggerDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <AppText style={styles.deleteText}>Xóa</AppText>
        </TouchableOpacity>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          { transform: [{ translateX }], backgroundColor: c.bg },
        ]}
      >
        <View style={styles.row}>
          {/* Thumbnail */}
          <TouchableOpacity activeOpacity={0.85} style={styles.thumbWrap}>
            {item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.thumbPlaceholder,
                  { backgroundColor: Colors.primary[50] },
                ]}
              >
                <Ionicons name="book-outline" size={28} color={Colors.primary[300]} />
              </View>
            )}
            {pct > 0 && (
              <View style={styles.saleBadge}>
                <AppText variant="overline" style={styles.saleBadgeText}>
                  -{pct}%
                </AppText>
              </View>
            )}
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.info}>
            {item.catalogName && (
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
            )}
            <AppText
              variant="body2"
              weight="500"
              numberOfLines={2}
              style={[styles.name, { color: c.text }]}
            >
              {item.name}
            </AppText>
            <View style={styles.priceRow}>
              <AppText style={styles.priceMain}>{fmtVND(price)}</AppText>
              {pct > 0 && (
                <AppText variant="caption" style={styles.priceOld}>
                  {fmtVND(item.price)}
                </AppText>
              )}
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

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.sm,
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Spacing.borderRadius.md,
  },
  deleteTouch: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#fff",
    fontWeight: "600",
    marginTop: 4,
    fontSize: 12,
  },
  card: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Spacing.borderRadius.md,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  thumbWrap: {
    position: "relative",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Spacing.borderRadius.md,
    overflow: "hidden",
    flexShrink: 0,
  },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saleBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: Colors.error,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomRightRadius: Spacing.borderRadius.sm,
  },
  saleBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 9 },
  info: { flex: 1, gap: 4 },
  catalogRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  catalogText: { color: Colors.neutral[400], fontSize: 11 },
  name: { lineHeight: 18, fontSize: 14 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  priceMain: { fontSize: 15, fontWeight: "700", color: MEKO_RED },
  priceOld: {
    textDecorationLine: "line-through",
    color: Colors.neutral[400],
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
});

export default CartItemCard;
