// src/components/CourseCard/index.tsx
import { useCartSync } from '@/src/hooks/useCartSync';
import type { LiferayCatalogProduct } from '@/src/services/liferayService';
import { useTheme } from '@/src/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: LiferayCatalogProduct;
  onPress?: () => void;
  showAddToCartToast?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (sku: any) => {
  const p = sku?.price?.price ?? 0;
  return p === 0 ? 'Miễn phí' : p.toLocaleString('vi-VN') + 'đ';
};

const getRawPrice   = (sku: any): number => sku?.price?.price ?? 0;
const getPromoPrice = (sku: any): number | undefined => {
  const p  = sku?.price?.price ?? 0;
  const pp = sku?.price?.promoPrice;
  return pp && pp > 0 && pp < p ? pp : undefined;
};

const getSpec = (course: LiferayCatalogProduct, key: string): string | undefined =>
  course.productSpecifications?.find((s: any) => s.specificationKey === key)?.value;

const getImageUrl = (course: LiferayCatalogProduct): string =>
  course.images?.[0]?.src ?? course.images?.[0]?.url ?? '';

// ─── Component ────────────────────────────────────────────────────────────────

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  onPress,
  showAddToCartToast = true,
}) => {
  const { c, radius } = useTheme();
  const router = useRouter();
  const { addToCartAsync } = useCartSync();

  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoad] = useState(true);
  const [adding, setAdding]     = useState(false);

  const sku      = course.skus?.[0];
  const price    = fmtPrice(sku);
  const raw      = getRawPrice(sku);
  const promo    = getPromoPrice(sku);
  const duration = getSpec(course, 'duration') ?? 'Chưa cập nhật';
  const lessons  = parseInt(getSpec(course, 'lesson-count') ?? '0', 10);
  const imageUrl = getImageUrl(course);
  const brand    = course.catalogName ?? 'MekoEdu';
  const skuId = (sku as any)?.skuId ?? (sku as any)?.id ?? 0;


  // ── Thêm vào giỏ ────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);

    const payload = {
      productId:   course.id,
      skuId,                   // ← skuId (number), không phải sku code string
      quantity:    1,
      name:        course.name,
      price:       raw,
      promoPrice:  promo,
      thumbnail:   imageUrl,
      catalogName: course.catalogName,
    };

    console.log("🛒 [CourseCard] Bắt đầu thêm vào giỏ hàng với dữ liệu:", JSON.stringify(payload, null, 2));

    try {
      const cartItemId = await addToCartAsync(payload);
      console.log("📥 [CourseCard] Kết quả phản hồi từ addToCartAsync:", cartItemId);

      if (cartItemId && showAddToCartToast) {
        Alert.alert(
          'Thành công',
          `Đã thêm "${course.name}" vào giỏ hàng`,
          [
            { text: 'Tiếp tục mua', style: 'cancel' },
            { text: 'Xem giỏ hàng', onPress: () => router.push('/cart') },
          ]
        );
      } else if (!cartItemId) {
        console.error("❌ [CourseCard] Lỗi: Hàm cho ra kết quả rỗng (falsy). Kiểm tra lại logic bên trong useCartSync hook.");
        Alert.alert(
          '❌ Thất bại',
          `Không thể thêm vào giỏ hàng.\n\nChi tiết: Hàm 'addToCartAsync' trả về [${cartItemId}]. Vui lòng kiểm tra log hệ thống hoặc token.`
        );
      }
    } catch (error: any) {
      console.error("💥 [CourseCard] Exception crash xuất hiện trong handleAddToCart:", error);
      Alert.alert(
        '💥 Lỗi hệ thống',
        `Đã xảy ra lỗi nghiêm trọng:\n${error?.message || 'Không rõ nguyên nhân'}`
      );
    } finally {
      setAdding(false);
    }
  };

  // ── Mua ngay ─────────────────────────────────────────────────────────────
  const handleBuyNow = async () => {
    if (raw === 0) {
      onPress?.();
      return;
    }
    if (adding) return;
    setAdding(true);

    const payload = {
      productId:   course.id,
      skuId,                   // ← skuId (number), không phải sku code string
      quantity:    1,
      name:        course.name,
      price:       raw,
      promoPrice:  promo,
      thumbnail:   imageUrl,
      catalogName: course.catalogName,
    };

    console.log("🚀 [CourseCard] Bắt đầu xử lý Mua ngay với dữ liệu:", JSON.stringify(payload, null, 2));

    try {
      const cartItemId = await addToCartAsync(payload);
      console.log("📥 [CourseCard] Kết quả phản hồi Mua ngay:", cartItemId);

      if (cartItemId) {
        router.push('/cart/checkout');
      } else {
        console.error("❌ [CourseCard] Lỗi: Mua ngay không nhận được ID sản phẩm trong giỏ.");
        Alert.alert(
          '❌ Lỗi',
          `Không thể xử lý mua ngay.\n\nChi tiết: 'addToCartAsync' trả về [${cartItemId}].`
        );
      }
    } catch (error: any) {
      console.error("💥 [CourseCard] Exception crash xuất hiện trong handleBuyNow:", error);
      Alert.alert(
        '💥 Lỗi hệ thống',
        `Không thể mua ngay lập tức:\n${error?.message || 'Chưa rõ lỗi'}`
      );
    } finally {
      setAdding(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: c.bg, borderRadius: radius.lg, borderColor: c.border },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imgWrap}>
        {imgLoading && (
          <View style={[styles.imgLoader, { backgroundColor: c.border }]}>
            <ActivityIndicator size="small" color={c.primary} />
          </View>
        )}
        {!imgError ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.img,
              {
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
                opacity: imgLoading ? 0 : 1,
              },
            ]}
            resizeMode="cover"
            onLoadStart={() => setImgLoad(true)}
            onLoadEnd={() => setImgLoad(false)}
            onError={() => { setImgError(true); setImgLoad(false); }}
          />
        ) : (
          <View style={[styles.imgPlaceholder, { backgroundColor: c.border }]}>
            <MaterialCommunityIcons name="image-off" size={40} color={c.textSub} />
          </View>
        )}

        {raw === 0 && (
          <View style={[styles.badge, { backgroundColor: c.success ?? '#10b981', top: 8, right: 8 }]}>
            <Text style={styles.badgeText}>Miễn phí</Text>
          </View>
        )}
        {promo != null && promo < raw && (
          <View style={[styles.badge, { backgroundColor: c.error ?? '#ef4444', top: 8, right: 8 }]}>
            <Text style={styles.badgeText}>-{Math.round((1 - promo / raw) * 100)}%</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Brand */}
        <View style={styles.brandRow}>
          <View style={[styles.brandLogo, { backgroundColor: c.primary + '20' }]}>
            <Text style={[styles.brandLogoChar, { color: c.primary }]}>
              {(brand[0] ?? 'M').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.brandName, { color: c.textSub }]} numberOfLines={1}>
            {brand}
          </Text>
        </View>

        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {course.name}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={12} color={c.textSub} />
            <Text style={[styles.statText, { color: c.textSub }]}>{duration}</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="book-open-outline" size={12} color={c.textSub} />
            <Text style={[styles.statText, { color: c.textSub }]}>{lessons} bài</Text>
          </View>
        </View>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={[styles.ratingVal, { color: c.text }]}>4.5</Text>
          <Text style={[styles.reviewCount, { color: c.textSub }]}>(0)</Text>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          {promo != null && promo < raw ? (
            <>
              <Text style={[styles.price, { color: c.error ?? '#ef4444' }]}>
                {promo.toLocaleString('vi-VN')}đ
              </Text>
              <Text style={[styles.originalPrice, { color: c.textSub }]}>
                {raw.toLocaleString('vi-VN')}đ
              </Text>
            </>
          ) : (
            <Text style={[styles.price, { color: c.primary }]}>{price}</Text>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          {raw > 0 && (
            <TouchableOpacity
              style={[styles.cartBtn, { borderColor: c.border }, adding && styles.disabled]}
              onPress={handleAddToCart}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="cart-outline" size={16} color={c.primary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.buyBtn,
              { backgroundColor: raw === 0 ? (c.success ?? '#10b981') : c.primary },
              adding && styles.disabled,
            ]}
            onPress={handleBuyNow}
            disabled={adding}
          >
            <Text style={styles.buyBtnText}>{raw === 0 ? 'Học ngay' : 'Mua ngay'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CourseCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:           { borderWidth: 1, overflow: 'hidden' },
  imgWrap:        { position: 'relative', width: '100%', height: 160, backgroundColor: '#f0f0f0' },
  img:            { width: '100%', height: '100%' },
  imgLoader:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  imgPlaceholder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  badge:          { position: 'absolute', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, zIndex: 3 },
  badgeText:      { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  disabled:       { opacity: 0.6 },
  content:        { padding: 12 },
  brandRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  brandLogo:      { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 6 },
  brandLogoChar:  { fontSize: 10, fontWeight: 'bold' },
  brandName:      { fontSize: 11, flex: 1 },
  title:          { fontSize: 14, fontWeight: '600', marginBottom: 8, lineHeight: 18 },
  statsRow:       { flexDirection: 'row', marginBottom: 8, gap: 12 },
  statItem:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText:       { fontSize: 11 },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ratingVal:      { fontSize: 12, fontWeight: '600', marginHorizontal: 4 },
  reviewCount:    { fontSize: 11 },
  priceRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  price:          { fontSize: 16, fontWeight: 'bold' },
  originalPrice:  { fontSize: 12, textDecorationLine: 'line-through' },
  btnRow:         { flexDirection: 'row', gap: 8 },
  cartBtn:        { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', minHeight: 36 },
  buyBtn:         { flex: 2, borderRadius: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  buyBtnText:     { color: '#fff', fontSize: 13, fontWeight: '600' },
});
