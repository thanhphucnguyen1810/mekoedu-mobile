import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, View } from "react-native";

const BORDER_RADIUS = 5;

interface ProductCardProps {
  item: any;
  onPress?: (item: any) => void;
}

const ProductCard = ({ item, onPress }: ProductCardProps) => {
  const { c } = useTheme();

  const price = item.skus?.price;

  const originalPrice = price?.price ?? 0;
  const promoPrice = price?.promoPrice ?? 0;

  const hasDiscount = promoPrice > 0 && promoPrice < originalPrice;

  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - promoPrice) / originalPrice) * 100)
    : 0;

  const originalPriceText = price?.priceFormatted ?? `$ ${originalPrice}`;

  const promoPriceText = hasDiscount
    ? (price?.promoPriceFormatted ?? `$ ${promoPrice}`)
    : (price?.priceFormatted ?? `$ ${originalPrice}`);

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={[styles.card, { backgroundColor: c.bgSoft }]}
    >
      <View style={styles.imageBox}>
        <Image source={{ uri: item.urlImage }} style={styles.image} />

        {hasDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: c.primary }]}>
            <AppText style={styles.discountText}>-{discountPercent}%</AppText>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <AppText numberOfLines={2} style={[styles.title, { color: c.text }]}>
          {item.name}
        </AppText>

        <AppText
          numberOfLines={1}
          style={[styles.author, { color: c.textSub }]}
        >
          Tác giả: {item.productSpecifications?.author ?? "MekoEdu"}
        </AppText>

        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={13}
            color={c.textSub}
          />
          <AppText style={[styles.metaText, { color: c.textSub }]}>
            {item.productSpecifications?.courseDuration ?? "0"} giờ
          </AppText>
        </View>

        <View style={styles.priceRow}>
          {hasDiscount && (
            <AppText
              numberOfLines={1}
              style={[styles.oldPrice, { color: c.textSub }]}
            >
              {originalPriceText}
            </AppText>
          )}

          <AppText
            numberOfLines={1}
            style={[styles.price, { color: c.primary }]}
          >
            {promoPriceText}
          </AppText>
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
    height: 150,
  },

  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS,
  },

  discountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },

  cardBody: {
    padding: 10,
  },

  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  author: {
    fontSize: 12,
    marginTop: 4,
  },

  metaRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 12,
  },

  priceRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  oldPrice: {
    fontSize: 12,
    textDecorationLine: "line-through",
    flexShrink: 1,
  },

  price: {
    fontSize: 17,
    fontWeight: "800",
  },
});
