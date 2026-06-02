import { AppHeader } from "@/src/components/common";
import {
  getProduct,
  LiferayCatalogProduct,
} from "@/src/services/liferayService";
import { addToCart } from "@/src/store/slices/cartSlice";
import { Colors } from "@/src/theme";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const [course, setCourse] = useState<LiferayCatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!id) return;
        const data = await getProduct(Number(id));
        setCourse(data);
      } catch (error) {
        console.warn("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary[500]} />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy khóa học</Text>
      </View>
    );
  }

  const imageUrl =
    course.images?.[0]?.src ||
    course.images?.[0]?.url ||
    course.thumbnail ||
    "https://via.placeholder.com/800x600?text=MekoEdu";

  const sku = course.skus?.[0] as any;
  const price = sku?.price?.price ?? 0;
  const promoPrice = sku?.price?.promoPrice;
  const finalPrice = promoPrice ?? price;
  const originalPrice = promoPrice ? price : undefined;
  const discountPercent =
    promoPrice && price > 0
      ? Math.round(((price - promoPrice) / price) * 100)
      : 0;

  const categories =
    course.categories?.map((c) => c.name).join(", ") ?? "Chưa có danh mục";
  const specs = course.productSpecifications ?? [];
  const stripHtml = (html?: string) =>
    html
      ? html
          .replace(/<[^>]+>/g, "\n")
          .replace(/\n\s+/g, "\n")
          .trim()
      : "";

  return (
    <View style={styles.screen}>
      <AppHeader title="Chi tiết khóa học" showBack showCart />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageSection}>
          <Image source={{ uri: imageUrl }} style={styles.mainImage} />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.productTitle}>{course.name}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Danh mục:</Text>
            <Text style={styles.metaValue}>{categories}</Text>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.currentPrice}>
                {finalPrice.toLocaleString("vi-VN")} đ
              </Text>
              {originalPrice ? (
                <Text style={styles.oldPrice}>
                  {originalPrice.toLocaleString("vi-VN")} đ
                </Text>
              ) : null}
            </View>

            {discountPercent > 0 ? (
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>
                  -{discountPercent}%
                </Text>
              </View>
            ) : null}
          </View>

          {promoPrice ? (
            <Text style={styles.saveText}>
              Tiết kiệm: {(price - promoPrice).toLocaleString("vi-VN")} đ
            </Text>
          ) : null}

          {/* Product specifications (thông số) - moved above lessons */}
          <View style={styles.specsCard}>
            <Text style={styles.sectionTitle}>Thông số khóa học</Text>
            {specs.length === 0 ? (
              <Text style={styles.specLine}>Không có thông số</Text>
            ) : (
              specs.map((s: any, idx: number) => (
                <View key={idx} style={styles.specLineRow}>
                  <Text style={styles.specName}>
                    {s.specificationTitle ?? s.specificationKey}:
                  </Text>
                  <Text style={styles.specValue}>{s.value}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nội dung bài giảng</Text>
            {course.shortDescription ? (
              <Text>{course.shortDescription}</Text>
            ) : null}

            {course.description ? (
              <Text style={[styles.sectionText, { marginBottom: 12 }]}>
                {stripHtml(course.description)}
              </Text>
            ) : null}

            {(() => {
              const lessonSpecs = specs.filter((s: any) => {
                const key = (s.specificationKey || "").toLowerCase();
                const title = (s.specificationTitle || "").toLowerCase();
                return (
                  key.includes("bai") ||
                  key.includes("bài") ||
                  key.includes("lesson") ||
                  title.includes("bài") ||
                  title.includes("chương")
                );
              });

              if (lessonSpecs.length > 0) {
                return lessonSpecs.map((ls: any, i: number) => (
                  <View key={i} style={styles.lessonRow}>
                    <Text style={styles.lessonTitle}>
                      {ls.specificationTitle ?? ls.specificationKey}
                    </Text>
                    <Text style={styles.lessonMeta}>{ls.value}</Text>
                  </View>
                ));
              }

              return (
                <Text style={styles.sectionText}>
                  Toàn bộ bài giảng được liệt kê trong nội dung khóa học. (Nếu
                  bạn cần chi tiết, liên hệ nhà cung cấp)
                </Text>
              );
            })()}
          </View>

          {/* Đánh giá (xuống dưới phần bài giảng) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Đánh giá</Text>
            <Text style={styles.sectionText}>
              Chưa có đánh giá cho khóa học này.
            </Text>
          </View>

          {/* Controls: quantity & buy */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.addCartButton}
              onPress={() => {
                try {
                  dispatch(
                    addToCart({
                      id: course.id,
                      name: course.name,
                      thumbnail: course.thumbnail || imageUrl,
                      price: price,
                      promoPrice: promoPrice ?? undefined,
                      catalogName: course.catalogName,
                      quantity: quantity,
                    }),
                  );
                  console.log("Added to cart", course.id, quantity);
                } catch (e) {
                  console.warn("Add to cart failed", e);
                }
              }}
            >
              <Text style={styles.addCartText}>THÊM VÀO GIỎ HÀNG</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.buyNowButton}>
              <Text style={styles.buyNowText}>MUA NGAY</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background.secondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },
  imageSection: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: Colors.neutral[100],
  },
  mainImage: { width: "100%", height: 260 },
  infoSection: {
    backgroundColor: Colors.background.primary,
    borderRadius: 5,
    padding: 16,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  metaRow: { flexDirection: "row", marginBottom: 8 },
  metaLabel: { color: Colors.neutral[600], width: 80 },
  metaValue: { color: Colors.neutral[900], fontWeight: "700", fontSize: 14 },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  currentPrice: { fontSize: 24, fontWeight: "900", color: Colors.neutral[900] },
  oldPrice: {
    color: Colors.neutral[500],
    textDecorationLine: "line-through",
    marginTop: 6,
    fontSize: 14,
  },
  discountBadge: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: Colors.neutral[0],
    fontWeight: "800",
    fontSize: 14,
  },
  saveText: { color: Colors.primary[600], marginBottom: 8, fontSize: 14 },
  promoCard: {
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  promoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  promoHeaderText: { fontWeight: "800", color: Colors.neutral[900] },
  promoText: { color: Colors.neutral[700], fontSize: 13 },
  specsCard: {
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: { fontWeight: "800", marginBottom: 8 },
  sectionCard: {
    backgroundColor: Colors.background.primary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionText: { color: Colors.neutral[700], fontSize: 14, lineHeight: 20 },
  specLine: { color: Colors.neutral[600] },
  specLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  specName: { color: Colors.neutral[600], width: 120, fontSize: 14 },
  specValue: { color: Colors.neutral[900], fontWeight: "700", fontSize: 14 },
  lessonRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  lessonTitle: { color: Colors.neutral[900], fontWeight: "700", fontSize: 14 },
  lessonMeta: { color: Colors.neutral[600], marginTop: 4, fontSize: 14 },
  qtyValue: { marginHorizontal: 12, fontWeight: "800", fontSize: 14 },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    padding: 8,
    borderRadius: 10,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.background.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: { fontSize: 18, fontWeight: "800" },
  addCartButton: {
    flex: 1,
    backgroundColor: Colors.primary[600],
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addCartText: { color: Colors.neutral[0], fontWeight: "800" },
  buyNowButton: {
    backgroundColor: Colors.primary[600],
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buyNowText: { color: Colors.neutral[0], fontWeight: "800" },
});
