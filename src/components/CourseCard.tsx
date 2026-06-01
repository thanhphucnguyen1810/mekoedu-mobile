// src/components/CourseCard/index.tsx
import type { LiferayCatalogProduct } from '@/src/services/liferayService';
import { addToCart } from '@/src/store/slices/cartSlice';
import { useTheme } from '@/src/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';

interface CourseCardProps {
  course: LiferayCatalogProduct;
  onPress?: () => void;
  onAddToCartPress?: () => Promise<void> | void;
  onBuyCoursePress?: () => void;
  showAddToCartToast?: boolean; // Tùy chọn hiển thị toast
}

// Hàm format price từ object của Liferay
const formatPrice = (sku: any) => {
  const price = sku?.price?.price || 0;
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
};

// Lấy giá trị số (cho cart)
const getRawPrice = (sku: any) => {
  return sku?.price?.price || 0;
};

// Lấy giá khuyến mãi
const getPromoPrice = (sku: any) => {
  const promoPrice = sku?.price?.promoPrice;
  const price = sku?.price?.price || 0;
  // Chỉ trả về promoPrice nếu nó hợp lệ (có giá trị, >0 và < price)
  if (promoPrice && promoPrice > 0 && promoPrice < price) {
    return promoPrice;
  }
  return undefined;
};

// Lấy duration từ specifications
const getDuration = (course: LiferayCatalogProduct) => {
  const spec = course.productSpecifications?.find(s => s.specificationKey === 'duration');
  return spec?.value || 'Chưa cập nhật';
};

// Lấy lessonCount từ specifications
const getLessonCount = (course: LiferayCatalogProduct) => {
  const spec = course.productSpecifications?.find(
    s => s.specificationKey === 'lesson-count'
  );
  return parseInt(spec?.value || '0', 10);
};

// Lấy image URL
const getImageUrl = (course: LiferayCatalogProduct) => {
  return course.images?.[0]?.src || course.images?.[0]?.url || '';
};

// Lấy brand logo char
const getBrandLogoChar = (course: LiferayCatalogProduct) => {
  return (course.catalogName?.[0] || 'M').toUpperCase();
};

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  onAddToCartPress,
  onBuyCoursePress,
  showAddToCartToast = true,
}) => {
  const { c, radius } = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const sku = course.skus?.[0];
  const price = formatPrice(sku);
  const rawPrice = getRawPrice(sku);
  const promoPrice = getPromoPrice(sku);
  const duration = getDuration(course);
  const lessonCount = getLessonCount(course);
  const imageUrl = getImageUrl(course);
  const brandName = course.catalogName || 'MekoEdu';
  const brandLogoChar = getBrandLogoChar(course);
  
  const rating = 4.5;
  const reviewCount = 0;

  // Hàm thêm vào giỏ hàng mặc định sử dụng cartSlice
  const defaultAddToCart = async () => {
    // Tạo item cho giỏ hàng theo đúng format CartItem
    const cartItem = {
      id: course.id,
      name: course.name,
      thumbnail: imageUrl,
      price: rawPrice,
      promoPrice: promoPrice, // Sẽ tự động xử lý trong selector
      catalogName: course.catalogName,
      quantity: 1,
    };
    
    dispatch(addToCart(cartItem));
    
    // Hiển thị thông báo thành công
    if (showAddToCartToast) {
      Alert.alert(
        '✅ Thành công',
        `Đã thêm "${course.name}" vào giỏ hàng`,
        [
          { text: 'Tiếp tục mua', style: 'cancel' },
          { text: 'Xem giỏ hàng', onPress: () => router.push('/cart') }
        ]
      );
    }
  };

  // Hàm xử lý click add to cart
  const handleAddToCart = async () => {
    if (isAddingToCart) return;
    
    // Kiểm tra nếu khóa học miễn phí
    if (rawPrice === 0) {
      Alert.alert(
        '📚 Khóa học miễn phí',
        'Khóa học này hoàn toàn miễn phí! Bạn có muốn bắt đầu học ngay?',
        [
          { text: 'Để sau', style: 'cancel' },
          { text: 'Học ngay', onPress: onPress }
        ]
      );
      return;
    }
    
    try {
      setIsAddingToCart(true);
      if (onAddToCartPress) {
        await onAddToCartPress(); // Dùng callback nếu có (override)
      } else {
        await defaultAddToCart(); // Dùng action mặc định
      }
    } catch (error) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      Alert.alert('❌ Lỗi', 'Không thể thêm khóa học vào giỏ hàng. Vui lòng thử lại!');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Hàm xử lý mua ngay
  const handleBuyNow = () => {
    if (rawPrice === 0) {
      // Nếu miễn phí thì chuyển đến trang học
      onPress?.();
    } else {
      // Thêm vào giỏ và chuyển đến checkout
      const cartItem = {
        id: course.id,
        name: course.name,
        thumbnail: imageUrl,
        price: rawPrice,
        promoPrice: promoPrice,
        catalogName: course.catalogName,
        quantity: 1,
      };
      dispatch(addToCart(cartItem));
      router.push('/cart/checkout');
    }
  };

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
      <View style={styles.imageContainer}>
        {imageLoading && (
          <View style={[styles.imageLoading, { backgroundColor: c.border }]}>
            <ActivityIndicator size="small" color={c.primary} />
          </View>
        )}
        <Image 
          source={{ uri: imageError ? '' : imageUrl }}
          style={[
            styles.image, 
            { 
              borderTopLeftRadius: radius.lg, 
              borderTopRightRadius: radius.lg,
              opacity: imageLoading ? 0 : 1
            }
          ]}
          resizeMode="contain"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
        {imageError && (
          <View style={[styles.imagePlaceholder, { backgroundColor: c.border }]}>
            <MaterialCommunityIcons name="image-off" size={40} color={c.textSub} />
            <Text style={[styles.imagePlaceholderText, { color: c.textSub }]}>
              Không thể tải ảnh
            </Text>
          </View>
        )}
        
        {/* Hiển thị badge miễn phí nếu giá = 0 */}
        {rawPrice === 0 && (
          <View style={[styles.freeBadge, { backgroundColor: c.success || '#10b981' }]}>
            <Text style={styles.freeBadgeText}>Miễn phí</Text>
          </View>
        )}
        
        {/* Hiển thị badge giảm giá */}
        {promoPrice && promoPrice > 0 && promoPrice < rawPrice && (
          <View style={[styles.discountBadge, { backgroundColor: c.error || '#ef4444' }]}>
            <Text style={styles.discountBadgeText}>
              -{Math.round((1 - promoPrice / rawPrice) * 100)}%
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={[styles.brandLogo, { backgroundColor: c.primary + '20' }]}>
            <Text style={[styles.brandLogoText, { color: c.primary }]}>{brandLogoChar}</Text>
          </View>
          <Text style={[styles.brandName, { color: c.textSub }]} numberOfLines={1}>
            {brandName}
          </Text>
        </View>
        
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {course.name}
        </Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={12} color={c.textSub} />
            <Text style={[styles.statsText, { color: c.textSub }]}>{duration}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="book-open-outline" size={12} color={c.textSub} />
            <Text style={[styles.statsText, { color: c.textSub }]}>{lessonCount} bài</Text>
          </View>
        </View>
        
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={[styles.ratingText, { color: c.text }]}>{rating.toFixed(1)}</Text>
          <Text style={[styles.reviewText, { color: c.textSub }]}>({reviewCount})</Text>
        </View>
        
        <View style={styles.priceContainer}>
          {promoPrice && promoPrice > 0 && promoPrice < rawPrice ? (
            <>
              <Text style={[styles.price, { color: c.error || '#ef4444' }]}>
                {promoPrice.toLocaleString("vi-VN")}đ
              </Text>
              <Text style={[styles.originalPrice, { color: c.textSub }]}>
                {rawPrice.toLocaleString("vi-VN")}đ
              </Text>
            </>
          ) : (
            <Text style={[styles.price, { color: c.primary }]}>{price}</Text>
          )}
        </View>
        
        <View style={styles.buttonRow}>
          {rawPrice > 0 && (
            <TouchableOpacity 
              style={[
                styles.cartButton, 
                { borderColor: c.border },
                isAddingToCart && { opacity: 0.6 }
              ]} 
              onPress={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="cart-outline" size={16} color={c.primary} />
              )}
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.buyButton, 
              { backgroundColor: rawPrice === 0 ? (c.success || '#10b981') : c.primary }
            ]} 
            onPress={handleBuyNow}
          >
            <Text style={[styles.buyButtonText, { color: '#FFF' }]}>
              {rawPrice === 0 ? 'Học ngay' : 'Mua ngay'}
            </Text>
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
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 12,
  },
  freeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 3,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 3,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
    marginBottom: 8,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsText: {
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
    marginLeft: 4,
  },
  reviewText: {
    fontSize: 11,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
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
    justifyContent: 'center',
    minHeight: 36,
  },
  buyButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
