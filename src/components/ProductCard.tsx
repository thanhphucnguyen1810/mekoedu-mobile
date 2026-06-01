// src/components/ProductCard/index.tsx
import { useTheme } from '@/src/theme';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProductCardProps {
  id: string | number;
  title: string;
  price: number | { price: number };
  duration?: string;
  lessonCount?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl: string;
  brandName: string;
  brandLogoChar: string;
  onPress: () => void;
  onAddToCartPress: () => void;
  onBuyCoursePress: () => void;
}

  
function formatPrice(priceValue: number | undefined | null | { price?: number }) {
  // Nếu là object, lấy price.price
  let actualPrice: number | undefined | null;
  
  if (typeof priceValue === 'object' && priceValue !== null) {
    actualPrice = priceValue.price;
  } else {
    actualPrice = priceValue as number | undefined | null;
  }
  
  // Kiểm tra giá trị hợp lệ
  if (!actualPrice || actualPrice === 0 || isNaN(actualPrice)) {
    return "Miễn phí";
  }
  
  return actualPrice.toLocaleString("vi-VN") + "đ";
}


export const ProductCard: React.FC<ProductCardProps> = ({
  title,
  price,
  duration,
  lessonCount,
  rating,
  reviewCount,
  imageUrl,
  brandName,
  brandLogoChar,
  onPress,
  onAddToCartPress,
  onBuyCoursePress,
}) => {
  const { c, spacing, radius } = useTheme();
  console.log(imageUrl);
  
  return (
    <TouchableOpacity 
      style={[styles.card, { 
        backgroundColor: c.bg,
        borderRadius: radius.lg,
        borderColor: c.border 
      }]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: imageUrl }} 
        style={[styles.image, { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]} 
      />
      
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={[styles.brandLogo, { backgroundColor: c.primary + '20' }]}>
            <Text style={[styles.brandLogoText, { color: c.primary }]}>{brandLogoChar || 'M'}</Text>
          </View>
          <Text style={[styles.brandName, { color: c.textSub }]} numberOfLines={1}>
            {brandName || 'MekoEdu'}
          </Text>
        </View>
        
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {title}
        </Text>
        
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: c.textSub }]}>⏱ {duration || 'Chưa cập nhật'}</Text>
          <Text style={[styles.statsText, { color: c.textSub }]}>📚 {lessonCount ?? 0} bài</Text>
        </View>
        
        <View style={styles.ratingRow}>
          <Text style={styles.ratingStar}>⭐</Text>
          <Text style={[styles.ratingText, { color: c.text }]}>
            {(rating ?? 0).toFixed(1)}
          </Text>
          <Text style={[styles.reviewText, { color: c.textSub }]}>({reviewCount ?? 0})</Text>
        </View>
        
        <Text style={[styles.price, { color: c.primary }]}>{formatPrice(price)}</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.cartButton, { borderColor: c.border }]} 
            onPress={onAddToCartPress}
          >
            <Text style={[styles.cartButtonText, { color: c.primary }]}>🛒</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.buyButton, { backgroundColor: c.primary }]} 
            onPress={onBuyCoursePress}
          >
            <Text style={[styles.buyButtonText, { color: '#FFF' }]}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  content: {
    padding: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  brandLogoText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  brandName: {
    fontSize: 11,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingStar: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  reviewText: {
    fontSize: 11,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cartButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cartButtonText: {
    fontSize: 16,
  },
  buyButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
