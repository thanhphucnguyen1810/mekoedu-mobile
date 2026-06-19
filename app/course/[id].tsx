import { AppHeader } from "@/src/components/common";
import { getProduct } from "@/src/services/liferay";
import { addToCart } from "@/src/store/slices/cartSlice";
import { Colors } from "@/src/theme";
import type { CatalogProduct } from "@/src/types/liferay";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

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

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Ảnh carousel ở đầu trang */
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
          <Image
            source={{ uri: item }}
            style={{ width, height: IMG_H }}
            contentFit="cover"
            transition={150}
          />
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

/** Hàng thông tin nhỏ (icon + nhãn + giá trị) */
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

/** Card thông số kỹ thuật — hiển thị tất cả specs từ API */
const SpecCard = ({ specs }: { specs: any[] }) => {
  if (specs.length === 0) return null;
  return (
    <View style={cs.card}>
      <Text style={cs.cardTitle}>Thông số khóa học</Text>
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

/** Card mô tả đầy đủ */
const DescCard = ({ short, full }: { short?: string; full?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const fullText = stripHtml(full);
  const shortText = short ? stripHtml(short) : fullText.slice(0, 200);
  const hasMore = fullText.length > 200;

  if (!short && !full) return null;

  return (
    <View style={cs.card}>
      <Text style={cs.cardTitle}>Mô tả khóa học</Text>
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

/** Tag badge */
const Tag = ({ label }: { label: string }) => (
  <View style={cs.tag}>
    <Text style={cs.tagText}>{label}</Text>
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [course, setCourse] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

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

  if (loading) {
    return (
      <View style={cs.screen}>
        <AppHeader title="Chi tiết khóa học" showBack showCart />
        <View style={cs.center}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={cs.screen}>
        <AppHeader title="Chi tiết khóa học" showBack showCart />
        <View style={cs.center}>
          <MaterialCommunityIcons name="book-off-outline" size={48} color={Colors.neutral[300]} />
          <Text style={cs.emptyText}>Không tìm thấy khóa học</Text>
          <TouchableOpacity onPress={() => router.back()} style={cs.backLink}>
            <Text style={cs.backLinkText}>← Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Tính toán giá ──────────────────────────────────────────────────────────
  const sku = course.skus?.[0] as any;
  const price: number = sku?.price?.price ?? 0;
  const promoPrice: number | undefined = sku?.price?.promoPrice ?? undefined;
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
  console.log(specs);
  
  // Tách specs theo nhóm (các spec có optionCategory hoặc không)
  const lessonSpecs = specs.filter((s) => {
    const k = (s.specificationKey || "").toLowerCase();
    const t = (s.specificationTitle || "").toLowerCase();
    return (
      k.includes("bai") || k.includes("bài") || k.includes("lesson") ||
      t.includes("bài") || t.includes("chương") || t.includes("lesson")
    );
  });
  const otherSpecs = specs.filter((s) => !lessonSpecs.includes(s));

  // ── Categories / tags ─────────────────────────────────────────────────────
  const categories: string[] = course.categories?.map((c: any) => c.name) ?? [];

  // ── Add to cart ────────────────────────────────────────────────────────────
  const handleAddToCart = () => {
    try {
      dispatch(
        addToCart({
          id: course.id,
          name: course.name,
          thumbnail: course.thumbnail || images[0],
          price,
          promoPrice,
          catalogName: course.catalogName,
          quantity: 1,
          cartItemId: 0,
          skuId: sku?.id ?? 0,
        })
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e) {
      console.warn("Add to cart failed", e);
    }
  };

  return (
    <View style={cs.screen}>
      <AppHeader title="Chi tiết khóa học" showBack showCart />

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
          {/* Tags danh mục */}
          {categories.length > 0 && (
            <View style={cs.tagRow}>
              {categories.map((c, i) => (
                <Tag key={i} label={c} />
              ))}
            </View>
          )}

          <Text style={cs.productTitle}>{course.name}</Text>

          {/* Rating placeholder — replace khi có data */}
          <View style={cs.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons
                key={n}
                name={n <= 4 ? "star" : "star-half"}
                size={14}
                color="#F59E0B"
              />
            ))}
            <Text style={cs.ratingText}>4.5 · 1.2k học viên</Text>
          </View>

          {/* Giá */}
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
            {sku?.sku ? (
              <MetaRow icon="barcode" label="Mã SKU" value={sku.sku} />
            ) : null}
            {course.productStatus ? (
              <MetaRow
                icon="circle-slice-8"
                label="Trạng thái"
                value={course.productStatus === "approved" ? "Đang mở bán" : course.productStatus}
              />
            ) : null}
            {sku?.availableQuantity !== undefined ? (
              <MetaRow
                icon="account-group-outline"
                label="Còn chỗ"
                value={sku.availableQuantity > 0 ? `${sku.availableQuantity} chỗ` : "Hết chỗ"}
              />
            ) : null}
          </View>

          {/* ── Mô tả ── */}
          <DescCard short={course.shortDescription} full={course.description} />

          {/* ── Thông số (specs không phải lesson) ── */}
          <SpecCard specs={otherSpecs} />

          {/* ── Nội dung bài giảng (specs là lesson) ── */}
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

          {/* ── Đánh giá (placeholder) ── */}
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
      <View style={cs.bottomBar}>
        <View style={cs.bottomInner}>
          <View>
            <Text style={cs.bottomPrice}>{formatPrice(finalPrice)}</Text>
            {promoPrice !== undefined && price > 0 && (
              <Text style={cs.bottomOldPrice}>{formatPrice(price)}</Text>
            )}
          </View>

          <View style={cs.btnRow}>
            <TouchableOpacity
              style={cs.cartBtn}
              onPress={handleAddToCart}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name={added ? "check" : "cart-plus"}
                size={20}
                color={Colors.primary[600]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={cs.buyBtn}
              activeOpacity={0.85}
              onPress={() => {
                handleAddToCart();
                router.push("/cart");
              }}
            >
              <Text style={cs.buyBtnText}>Mua ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },

  // Empty / error
  emptyText: { fontSize: 15, color: Colors.neutral[500], marginTop: 8 },
  backLink: { marginTop: 4 },
  backLinkText: { fontSize: 14, color: Colors.primary[500] },

  // Carousel dots
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

  // Hero block
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

  // Rating
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 12 },
  ratingText: { fontSize: 12, color: Colors.neutral[500], marginLeft: 4 },

  // Price
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

  // Card
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

  // Meta row
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

  // Description
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

  // Specs
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 12,
  },
  specKey: {
    fontSize: 13,
    color: Colors.neutral[500],
    flex: 1,
  },
  specVal: {
    fontSize: 13,
    color: Colors.neutral[800],
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  // Lessons
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

  // Empty state inside card
  emptyState: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyStateText: { fontSize: 13, color: Colors.neutral[400] },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: Colors.neutral[200],
    paddingBottom: 24, // safe area
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
});