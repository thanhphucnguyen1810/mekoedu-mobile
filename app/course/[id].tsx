import { AppHeader } from "@/src/components/common";
import { SkuSelector } from "@/src/components/SkuSelector";
import { useCartSync } from "@/src/hooks/useCartSync";
import { useFlyToCart } from "@/src/hooks/useFlyToCart";
import { getProduct } from "@/src/services/liferay";
import { Colors } from "@/src/theme";
import type { CatalogProduct } from "@/src/types/liferay";
import { findMatchingSku, groupOptionsByKey, isSelectionComplete, SkuSelection } from "@/src/utils/skuUtils";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Helpers ────────────────────────────────────────────────────────────────
const stripHtml = (html?: string) =>
  html
    ? html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/?(p|div|li|h[1-6])[^>]*>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    : "";

const formatPrice = (v: number) =>
  v === 0 ? "Miễn phí" : v.toLocaleString("vi-VN") + " đ";

const MEKO_RED = Colors.primary[500];

// ─── Sub-components ──────────────────────────────────────────────────────────

const ImageCarousel = ({ images }: { images: string[] }) => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const IMG_H = Math.round(width * 0.56);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(idx);
  };

  if (images.length === 0) return null;

  return (
    <View style={{ backgroundColor: Colors.neutral[100] }}>
      <FlatList
        ref={flatRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={{ width, height: IMG_H, overflow: 'hidden' }}>
            <Image
              source={{ uri: item }}
              style={{
                width: width,
                height: IMG_H,
              }}
              contentFit="cover"
              contentPosition="center"
              transition={150}
              placeholder={Colors.neutral[100]}
              placeholderContentFit="cover"
            />
          </View>
        )}
      />
      {images.length > 1 && (
        <View style={cs.dotRow}>
          {images.map((_, i) => (
            <View
              key={i}
              style={[cs.dot, i === index ? cs.dotActive : cs.dotInactive]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const MetaRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={cs.metaRow}>
    <MaterialCommunityIcons
      name={icon as any}
      size={15}
      color={Colors.neutral[500]}
      style={{ marginTop: 1 }}
    />
    <Text style={cs.metaLabel}>{label}</Text>
    <Text style={cs.metaValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const SpecCard = ({ specs }: { specs: any[] }) => {
  if (specs.length === 0) return null;
  // console.log(specs);
  
  return (
    <View style={cs.card}>
      <Text style={cs.cardTitle}>Thông số sản phẩm</Text>
      {specs.map((s: any, i: number) => (
        <View
          key={i}
          style={[
            cs.specRow,
            i < specs.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: Colors.neutral[100] },
          ]}
        >
          <Text style={cs.specKey}>
            {s.specificationTitle ?? s.specificationKey ?? `Mục ${i + 1}`}
          </Text>
          <Text style={cs.specVal}>{s.value ?? "—"}</Text>
        </View>
      ))}
    </View>
  );
};

const DescCard = ({ short, full }: { short?: string; full?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const fullText = stripHtml(full);
  const hasMore = fullText.length > 200;

  if (!short && !full) return null;

  return (
    <View style={cs.card}>
      <Text style={cs.cardTitle}>Mô tả sản phẩm</Text>
      {short ? <Text style={cs.shortDesc}>{stripHtml(short)}</Text> : null}
      {fullText ? (
        <>
          <Text style={cs.bodyText} numberOfLines={expanded ? undefined : 4}>
            {fullText}
          </Text>
          {hasMore && (
            <TouchableOpacity
              onPress={() => setExpanded((p) => !p)}
              style={cs.expandBtn}
            >
              <Text style={cs.expandText}>
                {expanded ? "Thu gọn ↑" : "Xem thêm ↓"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      ) : null}
    </View>
  );
};

const Tag = ({ label }: { label: string }) => (
  <View style={cs.tag}>
    <Text style={cs.tagText}>{label}</Text>
  </View>
);

// ─── Toast nhẹ (giống CourseCard) ───────────────────────────────────────────
const InlineToast = ({
  msg,
  bottomOffset = 90,
}: {
  msg: { text: string; type: "success" | "error" } | null;
  bottomOffset?: number;
}) => {
  if (!msg) return null;
  return (
    <View
      style={[
        cs.toast,
        { bottom: bottomOffset },
        {
          backgroundColor:
            msg.type === "success"
              ? "rgba(16,185,129,0.95)"
              : "rgba(239,68,68,0.95)",
        },
      ]}
    >
      <Ionicons
        name={msg.type === "success" ? "checkmark-circle" : "close-circle"}
        size={14}
        color="#fff"
      />
      <Text style={cs.toastText}>{msg.text}</Text>
    </View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  //  Dùng useCartSync thay vì dispatch addToCart local
  const { addToCartAsync } = useCartSync();
  const { flyFrom } = useFlyToCart();

  const [course, setCourse] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingCart, setIsAddingCart] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── SKU selection state ────────────────────────────────────────────────────
  const [skuSelection, setSkuSelection] = useState<SkuSelection>({});

  // Ref nút giỏ hàng để đo vị trí fly animation
  const cartBtnRef = useRef<View>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await getProduct(Number(id));
        setCourse(data);
      } catch (e) {
        console.warn("Failed to load product", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg({ text, type });
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  };

  // ── Tính toán SKU đang chọn ────────────────────────────────────────────────
  const skus = course?.skus ?? [];
  const skuGroups = useMemo(() => groupOptionsByKey(skus as any[]), [skus]);
  const selectedSku = useMemo(() => findMatchingSku(skus as any[], skuSelection), [skus, skuSelection]);
  const hasOptions = skuGroups.length > 0;
  const selectionComplete = !hasOptions || isSelectionComplete(skuGroups, skuSelection);

  const handleAddToCart = async () => {
    if (!course || isAddingCart) return;

    if (hasOptions && !selectionComplete) {
      showToast("Vui lòng chọn phân loại sản phẩm", "error");
      return;
    }

    const sku = (selectedSku ?? skus[0]) as any;
    if (!sku) {
      showToast("Không tìm thấy SKU sản phẩm", "error");
      return;
    }

    const skuId = sku.id ?? sku.skuId ?? 0;
    const price: number = sku.price?.price ?? 0;
    const promoPrice: number | undefined =
      sku.price?.promoPrice && sku.price.promoPrice < price
        ? sku.price.promoPrice
        : undefined;
    const imageUrl = course.images?.[0]
      ? typeof course.images[0] === "string"
        ? course.images[0]
        : (course.images[0] as any).src ?? ""
      : course.thumbnail ?? "";

    if (!skuId) {
      showToast("Không tìm thấy SKU sản phẩm", "error");
      return;
    }

    // ── Tạo optionsLabel từ skuOptions ──
    const skuOptions = sku.skuOptions || [];
    const optionsLabel = skuOptions
      .map((opt: any) => {
        const name = opt.skuOptionName || '';
        const value = opt.skuOptionValueNames?.[0] || '';
        return value ? `${name}: ${value}` : '';
      })
      .filter(Boolean)
      .join(' - ');

    const displayName = course.name;

    setIsAddingCart(true);
    try {
      const cartItemId = await addToCartAsync({
        productId: course.id,
        skuId,
        quantity: 1,
        name: course.name,
        displayName,     
        optionsLabel,  
        price,
        promoPrice,
        thumbnail: imageUrl,
        catalogName: course.catalogName,
      });

      if (cartItemId) {
        cartBtnRef.current?.measureInWindow((x, y, width, height) => {
          const origin = { x: x + width / 2, y: y + height / 2 };
          flyFrom(origin, MEKO_RED, imageUrl);
        });
        showToast("Đã thêm vào giỏ hàng", "success");
      } else {
        showToast("Không thể thêm vào giỏ", "error");
      }
    } catch (error: any) {
      showToast(error?.message ?? "Đã xảy ra lỗi", "error");
    } finally {
      setIsAddingCart(false);
    }
  };

  //  Mua ngay: thêm vào giỏ rồi navigate
  const handleBuyNow = async () => {
    if (!course || isAddingCart) return;
    await handleAddToCart();
    router.push("/cart");
  };

  if (loading) {
    return (
      <View style={cs.screen}>
        <AppHeader title="Chi tiết sản phẩm" showBack showCart />
        <View style={cs.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={cs.screen}>
        <AppHeader title="Chi tiết sản phẩm" showBack showCart />
        <View style={cs.center}>
          <MaterialCommunityIcons name="book-off-outline" size={48} color={Colors.neutral[300]} />
          <Text style={cs.emptyText}>Không tìm thấy sản phẩm</Text>
          <TouchableOpacity onPress={() => router.back()} style={cs.backLink}>
            <Text style={cs.backLinkText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Tính toán giá — ưu tiên selectedSku nếu đã chọn, fallback sku[0] ──────
  const activeSku = (selectedSku ?? skus[0]) as any;
  const price: number = activeSku?.price?.price ?? 0;
  const promoPrice: number | undefined =
    activeSku?.price?.promoPrice && activeSku.price.promoPrice < price
      ? activeSku.price.promoPrice
      : undefined;
  const finalPrice = promoPrice ?? price;
  const discountPct =
    promoPrice && price > 0
      ? Math.round(((price - promoPrice) / price) * 100)
      : 0;

  // ── Ảnh ───────────────────────────────────────────────────────────────────
  const images: string[] = [
    ...(course.images?.map((img: any) => img.src).filter(Boolean) ?? []),
    course.thumbnail ? course.thumbnail : null,
  ].filter((u): u is string => !!u && u.length > 0);

  if (images.length === 0)
    images.push("https://via.placeholder.com/800x450?text=MekoEdu");

  // ── Specs ──────────────────────────────────────────────────────────────────
  const specs: any[] = course.productSpecifications ?? [];
  const lessonSpecs = specs.filter((s) => {
    const k = (s.specificationKey || "").toLowerCase();
    const t = (s.specificationTitle || "").toLowerCase();
    return (
      k.includes("bai") || k.includes("bài") || k.includes("lesson") ||
      t.includes("bài") || t.includes("chương") || t.includes("lesson")
    );
  });
  const otherSpecs = specs.filter((s) => !lessonSpecs.includes(s));

  const categories: string[] = course.categories?.map((c: any) => c.name) ?? [];

  return (
    <View style={cs.screen}>
      <AppHeader title="Chi tiết sản phẩm" showBack showCart />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Carousel ── */}
        <ImageCarousel images={images} />

        {/* ── Tiêu đề & giá ── */}
        <View style={cs.heroBlock}>
          {categories.length > 0 && (
            <View style={cs.tagRow}>
              {categories.map((c, i) => (
                <Tag key={i} label={c} />
              ))}
            </View>
          )}

          <Text style={cs.productTitle}>{course.name}</Text>

          {/* <View style={cs.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons
                key={n}
                name={n <= 4 ? "star" : "star-half"}
                size={14}
                color="#F59E0B"
              />
            ))}
            <Text style={cs.ratingText}>4.5 · 1.2k học viên</Text>
          </View> */}

          <View style={cs.priceBlock}>
            <Text style={cs.finalPrice}>{formatPrice(finalPrice)}</Text>
            {promoPrice !== undefined && price > 0 && (
              <View style={cs.oldPriceRow}>
                <Text style={cs.oldPrice}>{formatPrice(price)}</Text>
                {discountPct > 0 && (
                  <View style={cs.discBadge}>
                    <Text style={cs.discText}>-{discountPct}%</Text>
                  </View>
                )}
              </View>
            )}
            {promoPrice !== undefined && price > 0 && (
              <Text style={cs.saveText}>
                Tiết kiệm {formatPrice(price - promoPrice)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ paddingHorizontal: 14 }}>
          {/* ── Meta nhanh ── */}
          <View style={cs.card}>
            <Text style={cs.cardTitle}>Thông tin nhanh</Text>
            {course.catalogName ? (
              <MetaRow icon="store-outline" label="Danh mục" value={course.catalogName} />
            ) : null}
            {activeSku?.sku ? (
              <MetaRow icon="barcode" label="Mã SKU" value={activeSku.sku} />
            ) : null}
            {course.productStatus ? (
              <MetaRow
                icon="circle-slice-8"
                label="Trạng thái"
                value={course.productStatus === "approved" ? "Đang mở bán" : course.productStatus}
              />
            ) : null}
            {activeSku?.availableQuantity !== undefined ? (
              <MetaRow
                icon="account-group-outline"
                label="Còn chỗ"
                value={activeSku.availableQuantity > 0 ? `${activeSku.availableQuantity} chỗ` : "Hết chỗ"}
              />
            ) : null}
          </View>

          <DescCard short={course.shortDescription} full={course.description} />

          {/* ── SkuSelector inline (hiển thị khi có phân loại) ── */}
          {skuGroups.length > 0 && (
            <View style={cs.card}>
              <Text style={cs.cardTitle}>Phân loại</Text>
              <SkuSelector
                skus={skus as any[]}
                selection={skuSelection}
                onChange={(optKey, valueKey) =>
                  setSkuSelection((prev) => ({ ...prev, [optKey]: valueKey }))
                }
                selectedSku={selectedSku as any}
              />
            </View>
          )}

          <SpecCard specs={otherSpecs} />

          {lessonSpecs.length > 0 && (
            <View style={cs.card}>
              <Text style={cs.cardTitle}>Nội dung bài giảng</Text>
              {lessonSpecs.map((s: any, i: number) => (
                <View key={i} style={cs.lessonRow}>
                  <View style={cs.lessonDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={cs.lessonTitle}>
                      {s.specificationTitle ?? s.specificationKey}
                    </Text>
                    {s.value ? (
                      <Text style={cs.lessonMeta}>{s.value}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={cs.card}>
            <Text style={cs.cardTitle}>Đánh giá</Text>
            <View style={cs.emptyState}>
              <MaterialCommunityIcons
                name="comment-outline"
                size={32}
                color={Colors.neutral[300]}
              />
              <Text style={cs.emptyStateText}>Chưa có đánh giá nào</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View style={[cs.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={cs.bottomInner}>
          <View>
            <Text style={cs.bottomPrice}>{formatPrice(finalPrice)}</Text>
            {promoPrice !== undefined && price > 0 && (
              <Text style={cs.bottomOldPrice}>{formatPrice(price)}</Text>
            )}
          </View>

          <View style={cs.btnRow}>
            {/*  Nút thêm giỏ hàng với ref để đo vị trí fly animation */}
            <View ref={cartBtnRef} collapsable={false}>
              <TouchableOpacity
                style={[
                  cs.cartBtn,
                  (isAddingCart || (hasOptions && !selectionComplete)) && { opacity: 0.6 },
                ]}
                onPress={handleAddToCart}
                disabled={isAddingCart}
                activeOpacity={0.85}
              >
                {isAddingCart ? (
                  <ActivityIndicator size="small" color={Colors.primary[600]} />
                ) : (
                  <MaterialCommunityIcons
                    name="cart-plus"
                    size={20}
                    color={Colors.primary[600]}
                  />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                cs.buyBtn,
                isAddingCart && { opacity: 0.6 },
                hasOptions && !selectionComplete && { backgroundColor: Colors.neutral[300] },
              ]}
              activeOpacity={0.85}
              onPress={handleBuyNow}
              disabled={isAddingCart}
            >
              <Text style={cs.buyBtnText}>
                {isAddingCart
                  ? "Đang thêm..."
                  : hasOptions && !selectionComplete
                  ? "Chọn phân loại"
                  : "Mua ngay"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Toast nổi góc dưới màn hình */}
      <InlineToast msg={toastMsg} bottomOffset={insets.bottom + 90} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },

  emptyText: { fontSize: 15, color: Colors.neutral[500], marginTop: 8 },
  backLink: { marginTop: 4 },
  backLinkText: { fontSize: 14, color: Colors.primary[500] },

  dotRow: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    gap: 4,
  },
  dot: { height: 5, borderRadius: 3 },
  dotActive: { width: 14, backgroundColor: "#fff" },
  dotInactive: { width: 5, backgroundColor: "rgba(255,255,255,0.45)" },

  heroBlock: {
    backgroundColor: Colors.background.primary,
    padding: 14,
    marginBottom: 8,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagText: { fontSize: 11, color: Colors.primary[600], fontWeight: "600" },

  productTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.neutral[900],
    lineHeight: 25,
    marginBottom: 8,
  },

  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 12 },
  ratingText: { fontSize: 12, color: Colors.neutral[500], marginLeft: 4 },

  priceBlock: { gap: 3 },
  finalPrice: { fontSize: 26, fontWeight: "800", color: Colors.neutral[900] },
  oldPriceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  oldPrice: {
    fontSize: 14,
    color: Colors.neutral[400],
    textDecorationLine: "line-through",
  },
  discBadge: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  saveText: { fontSize: 12, color: Colors.primary[600], fontWeight: "600" },

  card: {
    backgroundColor: Colors.background.primary,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.neutral[900],
    marginBottom: 12,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.neutral[100],
  },
  metaLabel: {
    fontSize: 13,
    color: Colors.neutral[500],
    width: 80,
    flexShrink: 0,
  },
  metaValue: {
    flex: 1,
    fontSize: 13,
    color: Colors.neutral[800],
    fontWeight: "500",
  },

  shortDesc: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.neutral[800],
    marginBottom: 8,
    lineHeight: 20,
  },
  bodyText: {
    fontSize: 13,
    color: Colors.neutral[600],
    lineHeight: 20,
  },
  expandBtn: { marginTop: 8 },
  expandText: { fontSize: 13, color: Colors.primary[500], fontWeight: "600" },

  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 12,
  },
  specKey: { fontSize: 13, color: Colors.neutral[500], flex: 1 },
  specVal: {
    fontSize: 13,
    color: Colors.neutral[800],
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  lessonRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.neutral[100],
  },
  lessonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary[400],
    marginTop: 5,
    flexShrink: 0,
  },
  lessonTitle: { fontSize: 13, color: Colors.neutral[800], fontWeight: "600", lineHeight: 19 },
  lessonMeta: { fontSize: 12, color: Colors.neutral[500], marginTop: 2 },

  emptyState: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyStateText: { fontSize: 13, color: Colors.neutral[400] },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: Colors.neutral[200],
    paddingBottom: 24,
  },
  bottomInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  bottomPrice: { fontSize: 18, fontWeight: "800", color: Colors.neutral[900] },
  bottomOldPrice: {
    fontSize: 12,
    color: Colors.neutral[400],
    textDecorationLine: "line-through",
    marginTop: 1,
  },
  btnRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary[400],
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtn: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  buyBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  // ✅ Toast nổi bên dưới màn hình (trên bottom bar)
  toast: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    zIndex: 20,
  },
  toastText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
