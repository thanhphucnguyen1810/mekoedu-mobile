/**
 * src/components/SkuBottomSheet/index.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom sheet kiểu Shopee: hiện khi nhấn nút "+" trên CourseCard.
 * Cho phép chọn biến thể (Size, Màu sắc...) rồi thêm vào giỏ hàng.
 *
 * Cần cài: react-native-modal hoặc dùng Modal native
 * → Dùng Modal native để không cần cài thêm thư viện.
 */

import { Colors } from "@/src/theme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SkuSelection,
  findMatchingSku,
  formatVND,
  getSkuPrice,
  groupOptionsByKey,
  isSelectionComplete,
} from "@/src/utils/skuUtils";
import { SkuSelector } from "@/src/components/SkuSelector";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_MAX_H = SCREEN_H * 0.75;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Dữ liệu sản phẩm đầy đủ (có skus) */
  product: {
    name: string;
    thumbnail?: string;
    skus: any[];
    catalogName?: string;
  } | null;
  /** Callback khi nhấn "Thêm vào giỏ hàng" với SKU đã chọn */
  onAddToCart: (skuId: number, price: number, promoPrice?: number) => Promise<void>;
}

export function SkuBottomSheet({ visible, onClose, product, onAddToCart }: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SHEET_MAX_H)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [selection, setSelection] = useState<SkuSelection>({});
  const [isAdding, setIsAdding] = useState(false);
  const [addedOk, setAddedOk] = useState(false);

  const skus: any[] = product?.skus ?? [];
  const groups = useMemo(() => groupOptionsByKey(skus), [skus]);
  const selectedSku = useMemo(
    () => findMatchingSku(skus, selection),
    [skus, selection]
  );
  const complete = useMemo(
    () => isSelectionComplete(groups, selection),
    [groups, selection]
  );

  // Nếu chỉ có 1 SKU và không có option → tự động chọn
  useEffect(() => {
    if (visible && skus.length === 1 && groups.length === 0) {
      setSelection({});
    }
  }, [visible, skus, groups]);

  // Animation mở
  useEffect(() => {
    if (visible) {
      setSelection({});
      setAddedOk(false);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SHEET_MAX_H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOptionChange = useCallback((optKey: string, valueKey: string) => {
    setSelection((prev) => ({ ...prev, [optKey]: valueKey }));
    setAddedOk(false);
  }, []);

  const handleAddToCart = async () => {
    if (isAdding) return;
    const sku = selectedSku ?? (groups.length === 0 ? skus[0] : null);
    if (!sku) return;

    const { price, promoPrice } = getSkuPrice(sku);
    setIsAdding(true);
    try {
      await onAddToCart(sku.id, price, promoPrice);
      setAddedOk(true);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error('[SkuBottomSheet] add to cart failed:', err); // ★ thêm log để thấy lỗi thật
    } finally {
      setIsAdding(false);
    }
  };

  // Giá hiển thị: nếu đã chọn đủ thì dùng SKU match, ngược lại hiển thị khoảng giá
  const priceDisplay = useMemo(() => {
    if (selectedSku) {
      const { price, promoPrice } = getSkuPrice(selectedSku);
      return { label: formatVND(promoPrice ?? price), sub: promoPrice ? formatVND(price) : undefined };
    }
    // Tính min/max từ tất cả SKU
    const prices = skus.map((s) => {
      const { price, promoPrice } = getSkuPrice(s);
      return promoPrice ?? price;
    });
    if (prices.length === 0) return { label: "—" };
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return { label: formatVND(min) };
    return { label: `${formatVND(min)} – ${formatVND(max)}` };
  }, [selectedSku, skus]);

  const btnDisabled = groups.length > 0 && !complete;

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Overlay */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 12, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header: ảnh + tên + giá */}
        <View style={styles.header}>
          <View style={styles.thumbWrap}>
            {product.thumbnail ? (
              <Image
                source={{ uri: product.thumbnail }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <MaterialCommunityIcons
                  name="image-off"
                  size={28}
                  color={Colors.primary[200]}
                />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerPrice} numberOfLines={1}>
              {priceDisplay.label}
            </Text>
            {priceDisplay.sub && (
              <Text style={styles.headerPriceSub} numberOfLines={1}>
                {priceDisplay.sub}
              </Text>
            )}
            <Text style={styles.headerName} numberOfLines={2}>
              {product.name}
            </Text>
            {selectedSku && (
              <Text style={styles.headerSku} numberOfLines={1}>
                SKU: {selectedSku.sku}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={Colors.neutral[500]} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Body: SKU selector */}
        <ScrollView
          style={{ maxHeight: SHEET_MAX_H - 200 }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {groups.length > 0 ? (
            <SkuSelector
              skus={skus}
              selection={selection}
              onChange={handleOptionChange}
              selectedSku={selectedSku}
            />
          ) : (
            <View style={styles.noOptions}>
              <Text style={styles.noOptionsText}>Sản phẩm không có biến thể</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.divider} />

        {/* Footer: nút thêm giỏ */}
        <TouchableOpacity
          style={[
            styles.addBtn,
            btnDisabled && styles.addBtnDisabled,
            addedOk && styles.addBtnOk,
          ]}
          onPress={handleAddToCart}
          disabled={btnDisabled || isAdding || addedOk}
          activeOpacity={0.85}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : addedOk ? (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Đã thêm vào giỏ</Text>
            </>
          ) : (
            <>
              <Ionicons name="cart-outline" size={18} color={btnDisabled ? Colors.neutral[400] : "#fff"} />
              <Text style={[styles.addBtnText, btnDisabled && { color: Colors.neutral[400] }]}>
                {btnDisabled ? "Chọn phân loại" : "Thêm vào giỏ hàng"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[200],
    alignSelf: "center",
    marginBottom: 12,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  thumbWrap: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.neutral[100],
    flexShrink: 0,
  },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary[50],
  },
  headerInfo: { flex: 1, gap: 2 },
  headerPrice: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary[600],
  },
  headerPriceSub: {
    fontSize: 12,
    color: Colors.neutral[400],
    textDecorationLine: "line-through",
  },
  headerName: {
    fontSize: 13,
    color: Colors.neutral[600],
    marginTop: 4,
    lineHeight: 18,
  },
  headerSku: {
    fontSize: 11,
    color: Colors.neutral[400],
    marginTop: 2,
  },
  closeBtn: {
    padding: 2,
  },

  divider: {
    height: 0.5,
    backgroundColor: Colors.neutral[100],
    marginVertical: 4,
  },

  // ── Body ────────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  noOptions: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noOptionsText: {
    fontSize: 13,
    color: Colors.neutral[400],
  },

  // ── Footer ──────────────────────────────────────────────────────────────────
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
  },
  addBtnDisabled: {
    backgroundColor: Colors.neutral[100],
  },
  addBtnOk: {
    backgroundColor: "#10B981",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
