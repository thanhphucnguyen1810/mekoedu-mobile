import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { Image, Pressable, StyleSheet, View } from "react-native";

const BORDER_RADIUS = 10;

interface ProductCardProps {
  item?: any;
  onPress?: (item: any) => void;
}

const formatPrice = (value: number) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
};

const ProductCard = ({ item, onPress }: ProductCardProps) => {
  const { c } = useTheme();

  if (!item) return null;

  const firstSku = item?.skus?.[0] || item?.firstSku;

  const price = firstSku?.price?.price ?? 0;
  const promoPrice = firstSku?.price?.promoPrice ?? 0;

  const hasDiscount = promoPrice > 0 && promoPrice < price;
  const finalPrice = hasDiscount ? promoPrice : price;
  const originalPrice = hasDiscount ? price : undefined;

  const discountPercent = hasDiscount
    ? Math.round(((price - promoPrice) / price) * 100)
    : 0;

  const imageUrl =
    item?.urlImage || "https://via.placeholder.com/300x200?text=MekoEdu";

  const author =
    item?.productSpecifications?.author ||
    item?.productSpecifications?.Author ||
    "MekoEdu";

  const courseDuration =
    item?.productSpecifications?.courseDuration ||
    item?.productSpecifications?.courseduration ||
    item?.productSpecifications?.duration ||
    "0";

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[styles.card, { backgroundColor: c.bgSoft }]}
    >
      <View style={styles.imageBox}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {hasDiscount ? (
          <View style={[styles.discountBadge, { backgroundColor: c.primary }]}>
            <AppText style={styles.discountText}>-{discountPercent}%</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <AppText numberOfLines={2} style={[styles.title, { color: c.text }]}>
          {item?.name ?? "Không có tên"}
        </AppText>

        {/* <AppText
          numberOfLines={1}
          style={[styles.author, { color: c.textSub }]}
        >
          Tác giả: {author}
        </AppText> */}

        {/* <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={13}
            color={c.textSub}
          />

          <AppText style={[styles.metaText, { color: c.textSub }]}>
            {courseDuration} giờ
          </AppText>
        </View> */}

        <View style={styles.priceBox}>
          <AppText
            numberOfLines={1}
            style={[styles.currentPrice, { color: c.primary }]}
          >
            {formatPrice(finalPrice)}
          </AppText>

          {originalPrice ? (
            <AppText
              numberOfLines={1}
              style={[styles.oldPrice, { color: c.textSub }]}
            >
              {formatPrice(originalPrice)}
            </AppText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

export default ProductCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
  },
  imageBox: {
    position: "relative",
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: 145,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  cardBody: {
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 19,
    minHeight: 38,
  },
  author: {
    fontSize: 12,
    marginTop: 5,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  priceBox: {
    marginTop: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: "900",
  },
  oldPrice: {
    marginTop: 3,
    fontSize: 12,
    textDecorationLine: "line-through",
  },
});
