import { C, Colors, Radius, Spacing } from '@/src/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  brandName: string;
  brandLogoChar: string;
  title: string;
  price: number;
  imageUrl: string;
  duration: string;
  lessonCount: number;
  rating: number;
  reviewCount: number;
  onPress?: () => void;
  onAddToCartPress: () => void;
  onBuyCoursePress: () => void;
}

export const ProductCard = ({
  brandName,
  brandLogoChar,
  title,
  price,
  duration,
  lessonCount,
  rating,
  reviewCount,
  imageUrl,
  onPress,
  onAddToCartPress,
  onBuyCoursePress,
}: ProductCardProps) => {
  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const totalStars = 5;
    let stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<MaterialIcons key={`full-${i}`} name="star" size={14} color={C.warning} />);
    }
    if (hasHalfStar) {
      stars.push(<MaterialIcons key="half" name="star-half" size={14} color={C.warning} />);
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < totalStars; i++) {
      stars.push(<MaterialIcons key={`empty-${i}`} name="star-outline" size={14} color={C.warning} />);
    }
    return <View style={styles.starRating}>{stars}</View>;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="link"
      accessibilityLabel={`${title} khóa học bởi ${brandName}, Giá ${price.toLocaleString('vi-VN')} đ.`}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.info}>
        {/* Brand badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.badgeLogo}>
            <Text style={styles.badgeLogoText}>{brandLogoChar}</Text>
          </View>
          <Text style={styles.brandNameText}>{brandName}</Text>
        </View>

        {/* Title */}
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>

        {/* Price */}
        <Text style={styles.priceText}>
          {price.toLocaleString('vi-VN')} đ
        </Text>

        {/* Duration & Lessons */}
        <View style={styles.durationRow}>
          <View style={styles.infoBlock}>
            <MaterialIcons name="access-time" size={14} color={C.textSub} style={{ marginRight: 2 }} />
            <Text style={styles.captionText}>{duration}</Text>
          </View>
          <View style={styles.infoBlock}>
            <MaterialIcons name="book" size={14} color={C.textSub} style={{ marginRight: 2 }} />
            <Text style={styles.captionText}>{lessonCount} bài</Text>
          </View>
        </View>

        {/* Rating & Reviews */}
        <View style={styles.ratingRow}>
          {renderStarRating(rating)}
          <Text style={styles.reviewText} numberOfLines={1}>
            ({reviewCount})
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onAddToCartPress} style={styles.addToCartButton}>
            <MaterialIcons name="add-shopping-cart" size={20} color={C.textSub} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onBuyCoursePress} style={styles.buyButton}>
            <Text style={styles.buyButtonText}>MUA NGAY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,                  // Cho phép chia đều không gian trong row
    minWidth: 150,            // Đảm bảo trên màn nhỏ vẫn hiển thị được 2 cột
    backgroundColor: C.bg,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: C.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: C.bgSoft,
  },
  info: {
    padding: Spacing.sm,
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#C4E9DA',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  badgeLogo: {
    width: 16,
    height: 16,
    borderRadius: Radius.full,
    backgroundColor: C.bgSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  badgeLogoText: {
    color: '#1A6B53',
    fontWeight: '700',
    fontSize: 8,
  },
  brandNameText: {
    color: C.text,
    fontWeight: '500',
    fontSize: 10,
  },
  titleText: {
    color: C.text,
    fontSize: 13,
    marginBottom: 4,
  },
  priceText: {
    color: C.error,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captionText: {
    color: C.textSub,
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  reviewText: {
    color: C.textSub,
    marginLeft: 4,
    fontSize: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  addToCartButton: {
    padding: 4,
  },
  buyButton: {
    backgroundColor: '#F9A8A8',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    color: Colors?.primary[900] || '#B91C1C',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
