import { AppHeader } from "@/src/components/common";
import cartServiceApi from "@/src/services/cartService";
import productService, { IProduct } from "@/src/services/productService";
import userService from "@/src/services/userService";
import { setCartItems } from "@/src/store/slices/cartSlice";
import { Colors, useTheme } from "@/src/theme";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { showToast } from "../_layout";

const CHANNEL_ID = 32231;

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { c, spacing } = useTheme();
  const dispatch = useDispatch();

  const [course, setCourse] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [quantity] = useState(1);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        if (!id) return;

        const productId = Array.isArray(id) ? id[0] : id;
        const data = await productService.getProductById(Number(productId));

        setCourse(data);
      } catch (error) {
        console.warn("Failed to load product:", error);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  const stripHtml = (html?: string) => {
    if (!html) return "";

    return html
      .replace(/<[^>]+>/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/\n+/g, "\n")
      .trim();
  };

  const handleAddToCart = async () => {
    if (!course || addingCart) return false;

    try {
      setAddingCart(true);

      const accountId = await userService.getCurrentAccountId();

      if (!accountId) {
        Alert.alert("Lỗi", "Không lấy được Account ID");
        return false;
      }

      const skuId = course.skus?.[0]?.skuId || course.skus?.[0]?.id;

      if (!skuId) {
        Alert.alert("Lỗi", "Không lấy được SKU ID của sản phẩm");
        return false;
      }

      const cart = await cartServiceApi.getOrCreateCart(accountId, CHANNEL_ID);

      await cartServiceApi.addItemToCart(accountId, CHANNEL_ID, {
        skuId,
        quantity: quantity || 1,
      });

      const itemsData = await cartServiceApi.getCartItems(cart.id);

      dispatch(
        setCartItems(
          (itemsData.items ?? []).map((item: any) => ({
            id: item.id,
            productId: item.productId || item.product?.id || 0,
            skuId: item.skuId || item.sku?.id || item.sku?.skuId || 0,
            quantity: item.quantity ?? 1,
          })),
        ),
      );

      showToast("success", "Thêm sản phẩm vào giỏ hàng thành công");
      return true;
    } catch (error: any) {
      console.warn(
        "Add to cart failed:",
        error?.response?.data || error?.message,
      );

      Alert.alert(
        "Lỗi",
        error?.response?.data?.title ||
          error?.response?.data?.message ||
          "Không thể thêm vào giỏ hàng",
      );

      return false;
    } finally {
      setAddingCart(false);
    }
  };

  const handleBuyNow = async () => {};

  if (loading) {
    return (
      <View style={[styles.safeArea, { backgroundColor: c.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={[styles.safeArea, { backgroundColor: c.bg }]}>
        <AppHeader title="Chi tiết khóa học" showBack showCart />
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: c.textSub }]}>
            Không tìm thấy khóa học
          </Text>
        </View>
      </View>
    );
  }

  console.log(course);

  const imageUrl =
    course.urlImage || "https://via.placeholder.com/800x600?text=MekoEdu";

  const firstSku = course.skus?.[0];

  const price = firstSku?.price?.price ?? 0;
  const promoPrice = firstSku?.price?.promoPrice ?? 0;

  const finalPrice = promoPrice > 0 ? promoPrice : price;
  const originalPrice = promoPrice > 0 ? price : undefined;

  const discountPercent =
    promoPrice > 0 && price > 0
      ? Math.round(((price - promoPrice) / price) * 100)
      : 0;

  const categories =
    course.categories?.map((category) => category.name).join(", ") ||
    "Chưa có danh mục";

  const specEntries = course.productSpecifications ?? [];

  return (
    <View style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <AppHeader title="Chi tiết khóa học" showBack showCart />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.sm,
          paddingBottom: 112 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.imageSection,
            {
              marginBottom: spacing.sm,
              backgroundColor: c.bgSoft,
            },
          ]}
        >
          <Image
            source={{ uri: imageUrl }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>

        <View
          style={[
            styles.infoSection,
            {
              backgroundColor: c.bgSoft,
              padding: spacing.sm,
            },
          ]}
        >
          <Text style={[styles.productTitle, { color: c.text }]}>
            {course.name}
          </Text>

          {course.shortDescription ? (
            <Text style={[styles.shortDescription, { color: c.textSub }]}>
              {stripHtml(course.shortDescription)}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <Text style={[styles.metaLabel, { color: c.textSub }]}>
              Danh mục:
            </Text>
            <Text style={[styles.metaValue, { color: c.text }]}>
              {categories}
            </Text>
          </View>
          {/* 
          {author ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: c.textSub }]}>
                Tác giả:
              </Text>
              <Text style={[styles.metaValue, { color: c.text }]}>
                {author}
              </Text>
            </View>
          ) : null}

          {courseDuration ? (
            <View style={styles.metaRow}>
              <Text style={[styles.metaLabel, { color: c.textSub }]}>
                Thời lượng:
              </Text>
              <Text style={[styles.metaValue, { color: c.text }]}>
                {courseDuration}
              </Text>
            </View>
          ) : null} */}

          <View style={styles.priceRow}>
            <View>
              <Text style={[styles.currentPrice, { color: c.primary }]}>
                {finalPrice.toLocaleString("vi-VN")} đ
              </Text>

              {originalPrice ? (
                <Text style={[styles.oldPrice, { color: c.textSub }]}>
                  {originalPrice.toLocaleString("vi-VN")} đ
                </Text>
              ) : null}
            </View>

            {discountPercent > 0 ? (
              <View
                style={[styles.discountBadge, { backgroundColor: c.primary }]}
              >
                <Text style={styles.discountBadgeText}>
                  -{discountPercent}%
                </Text>
              </View>
            ) : null}
          </View>

          {promoPrice > 0 ? (
            <Text style={[styles.saveText, { color: c.primary }]}>
              Tiết kiệm: {(price - promoPrice).toLocaleString("vi-VN")} đ
            </Text>
          ) : null}

          <View
            style={[
              styles.specsCard,
              {
                backgroundColor: c.bg,
                padding: spacing.sm,
                marginTop: spacing.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Thông số khóa học
            </Text>

            {specEntries.length === 0 ? (
              <Text style={[styles.specLine, { color: c.textSub }]}>
                Không có thông số
              </Text>
            ) : (
              specEntries.map((item) => (
                <View key={item.key} style={styles.specLineRow}>
                  <Text style={[styles.specName, { color: c.textSub }]}>
                    {item.label}:
                  </Text>

                  <Text style={[styles.specValue, { color: c.text }]}>
                    {item.value}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: c.bgSoft,
                borderColor: c.border,
                padding: spacing.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Nội dung khóa học
            </Text>

            <Text style={[styles.sectionText, { color: c.textSub }]}>
              {course.description
                ? stripHtml(course.description)
                : "Chưa có mô tả chi tiết cho khóa học này."}
            </Text>
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: c.bgSoft,
                borderColor: c.border,
                padding: spacing.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Đánh giá
            </Text>
            <Text style={[styles.sectionText, { color: c.textSub }]}>
              Chưa có đánh giá cho khóa học này.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingHorizontal: spacing.sm,
            paddingTop: spacing.sm,
            paddingBottom: insets.bottom + spacing.sm,
            borderTopColor: c.border,
            backgroundColor: c.bg,
            gap: spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.cartButton,
            { backgroundColor: c.primary },
            addingCart && styles.disabledButton,
          ]}
          onPress={handleAddToCart}
          activeOpacity={0.9}
          disabled={addingCart}
        >
          <Text style={styles.cartButtonText}>
            {addingCart ? "ĐANG THÊM..." : "THÊM VÀO GIỎ"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buyButton,
            {
              borderColor: c.primary,
              backgroundColor: c.bg,
            },
            addingCart && styles.disabledButton,
          ]}
          onPress={handleBuyNow}
          activeOpacity={0.9}
          disabled={addingCart}
        >
          <Text style={[styles.buyButtonText, { color: c.primary }]}>
            MUA NGAY
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
  },
  imageSection: {
    borderRadius: 16,
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: 240,
  },
  infoSection: {
    borderRadius: 16,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  shortDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  metaLabel: {
    width: 90,
    fontSize: 14,
  },
  metaValue: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: "900",
  },
  oldPrice: {
    textDecorationLine: "line-through",
    marginTop: 4,
    fontSize: 14,
  },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: Colors.neutral[0],
    fontWeight: "800",
    fontSize: 14,
  },
  saveText: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  specsCard: {
    borderRadius: 12,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 8,
    fontSize: 16,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 21,
  },
  specLine: {
    fontSize: 14,
  },
  specLineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  specName: {
    width: 120,
    fontSize: 14,
    textTransform: "capitalize",
  },
  specValue: {
    flex: 1,
    fontWeight: "700",
    fontSize: 14,
    textAlign: "right",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cartButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buyButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  cartButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  buyButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
});
