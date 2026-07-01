// src/components/CourseCard/index.tsx
import { SkuBottomSheet } from '@/src/components/SkuBottomSheet';
import { AppConfig } from '@/src/config/appConfig';
import { useCartSync } from '@/src/hooks/useCartSync';
import { useFlyToCart } from '@/src/hooks/useFlyToCart';
import { getProduct } from '@/src/services/liferay';
import { Colors, Spacing, useTheme } from '@/src/theme';
import type { CatalogProduct, ProductSku, SkuOption } from '@/src/types/liferay';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';


// ─── Types ────────────────────────────────────────────────────────────────
export interface FlyRef {
  triggerFly: (sourceRect: { x: number; y: number; width: number; height: number }) => void;
}

interface CourseCardProps {
  course: CatalogProduct;
  onPress?: () => void;
  flyRef?: React.RefObject<FlyRef>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmtPrice = (sku: any) => {
  const p = sku?.price?.price ?? 0;
  return p === 0 ? 'Miễn phí' : p.toLocaleString('vi-VN') + 'đ';
};
const getRawPrice = (sku: any): number => sku?.price?.price ?? 0;
const getPromoPrice = (sku: any): number | undefined => {
  const p = sku?.price?.price ?? 0;
  const pp = sku?.price?.promoPrice;
  return pp && pp > 0 && pp < p ? pp : undefined;
};
const getImageUrl = (course: CatalogProduct) => {
  const firstImage = course.images?.[0];
  if (!firstImage) return '';
  if (typeof firstImage === 'string') return firstImage;
  return firstImage.src ?? firstImage.url ?? '';
};

const MEKO_RED = Colors.primary[500];

const LogoOverlay = () => {
  const logo = AppConfig.store.logo;
  return (
    <View>
      <Image
        source={logo}
        style={styles.logoImage}
        resizeMode="contain"
      />
    </View>
  );
};

// ─── CourseCard ───────────────────────────────────────────────────────────
export const CourseCard: React.FC<CourseCardProps> = ({ course, onPress }) => {
  // console.log('course.skus:', course.skus)
  const { c, radius } = useTheme();
  const { addToCartAsync } = useCartSync();
  const { flyFrom } = useFlyToCart();
  const cartBtnRef = useRef<View>(null);

  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoad] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── SKU Bottom Sheet state ──────────────────────────────────────────────
  const [sheetVisible, setSheetVisible] = useState(false);
  const [fullProduct, setFullProduct] = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const sku = course.skus?.[0];
  const productId = (sku as any)?.productId ?? course.id;
  const raw = getRawPrice(sku);
  const promo = getPromoPrice(sku);
  const price = fmtPrice(sku);
  const imageUrl = getImageUrl(course);
  const hasDiscount = promo != null && promo < raw;
  const pct = hasDiscount ? Math.round((1 - promo! / raw) * 100) : 0;

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg({ text, type });
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  };

  // ── Mở SkuBottomSheet (fetch product đầy đủ trước) ─────────────────────
  const handlePlusPress = async () => {
    if (loadingProduct) return;
    // console.log('[CourseCard] handlePlusPress, productId =', productId, '(course.id =', course.id, ')');
    setLoadingProduct(true);
    try {
      const data = await getProduct(productId);  // ★ dùng productId, KHÔNG dùng course.id
      // console.log('[CourseCard] getProduct success:', data?.id, data?.name, data?.skus?.length);
      setFullProduct(data);
      setSheetVisible(true);
    } catch (e) {
      console.error('[CourseCard] getProduct FAILED:', e);
      showToast('Không thể tải thông tin sản phẩm', 'error');
    } finally {
      setLoadingProduct(false);
    }
  };

  // ── Callback từ SkuBottomSheet khi user bấm "Thêm vào giỏ" ─────────────
   const handleSheetAddToCart = async (skuId: number, price: number, promoPrice?: number) => {
    const skuObj = (fullProduct?.skus as ProductSku[])?.find(s => s.id === skuId);
    if (!skuObj) {
      console.warn('SKU not found');
      return;
    }

    const optionsLabel = (skuObj.skuOptions || [])
      .map((opt: SkuOption) => {
        const name = opt.skuOptionName || '';
        const value = opt.skuOptionValueNames?.[0] || '';
        return value ? `${name}: ${value}` : '';
      })
      .filter(Boolean)
      .join(' - ');

    const payload = {
      productId,   
      skuId: skuObj.id,
      quantity: 1,
      name: course.name,
      displayName: course.name,
      optionsLabel,
      price,
      promoPrice,
      thumbnail: imageUrl,
      catalogName: course.catalogName,
    };
    const cartItemId = await addToCartAsync(payload);

    if (cartItemId) {
      cartBtnRef.current?.measureInWindow((x, y, width, height) => {
        flyFrom({ x: x + width / 2, y: y + height / 2 }, MEKO_RED, imageUrl);
      });
      showToast('Đã thêm vào giỏ hàng', 'success');
    } else {
      throw new Error('Không thể thêm vào giỏ');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: c.bg,
          borderRadius: radius.lg,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.92}
    >
      {/* ── Thumbnail + Logo overlay ── */}
      <View
        style={[
          styles.imgWrap,
          { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
        ]}
      >
        {/* Skeleton loader */}
        {imgLoading && (
          <View style={[styles.imgLoader, { backgroundColor: Colors.neutral[100] }]}>
            <ActivityIndicator size="small" color={MEKO_RED} />
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
            onError={() => {
              setImgError(true);
              setImgLoad(false);
            }}
          />
        ) : (
          <View
            style={[
              styles.imgPlaceholder,
              {
                backgroundColor: Colors.primary[50],
                borderTopLeftRadius: radius.lg,
                borderTopRightRadius: radius.lg,
              },
            ]}
          >
            <MaterialCommunityIcons name="image-off" size={36} color={Colors.primary[200]} />
          </View>
        )}

        {/* Free badge – góc trên phải */}
        {raw === 0 && (
          <View style={[styles.freeBadge, { backgroundColor: Colors.success }]}>
            <Text style={styles.freeBadgeText}>{AppConfig.courseCard.freeBadgeText}</Text>
          </View>
        )}
      </View>

      {/* ── Nội dung ── */}
      <View style={styles.content}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
          {course.name}
        </Text>

        <View style={styles.bottomRow}>
          <View style={styles.priceBlock}>
            {hasDiscount ? (
              <>
                <Text style={[styles.priceCurrent, { color: MEKO_RED }]} numberOfLines={1}>
                  {promo!.toLocaleString('vi-VN')}đ
                </Text>
                <View style={styles.originalRow}>
                  <Text style={[styles.priceOriginal, { color: c.textSub }]} numberOfLines={1}>
                    {raw.toLocaleString('vi-VN')}đ
                  </Text>
                  <View style={styles.discountChip}>
                    <Text style={styles.discountChipText}>-{pct}%</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text
                style={[
                  styles.priceCurrent,
                  { color: raw === 0 ? Colors.success : MEKO_RED },
                ]}
                numberOfLines={1}
              >
                {price}
              </Text>
            )}
          </View>

          {/* Nút + thêm giỏ hàng — mở SkuBottomSheet */}
          {raw > 0 && (
            <View ref={cartBtnRef} collapsable={false} style={styles.plusBtnContainer}>
              <TouchableOpacity
                style={[styles.plusBtn, { backgroundColor: MEKO_RED }]}
                onPress={handlePlusPress}
                disabled={loadingProduct}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {loadingProduct ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="add" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Toast nhẹ bên trong card */}
      {toastMsg && (
        <View
          style={[
            styles.toast,
            {
              backgroundColor:
                toastMsg.type === 'success'
                  ? 'rgba(16,185,129,0.95)'
                  : 'rgba(239,68,68,0.95)',
            },
          ]}
        >
          <Ionicons
            name={toastMsg.type === 'success' ? 'checkmark-circle' : 'close-circle'}
            size={13}
            color="#fff"
          />
          <Text style={styles.toastText}>{toastMsg.text}</Text>
        </View>
      )}

      {/* ── SkuBottomSheet (popup kiểu Shopee) ── */}
      <SkuBottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        product={fullProduct ? {
          name: fullProduct.name,
          thumbnail: imageUrl,
          skus: fullProduct.skus ?? [],
          catalogName: fullProduct.catalogName,
        } : null}
        onAddToCart={handleSheetAddToCart}
      />
    </TouchableOpacity>
  );
};

export default CourseCard;

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 220,
    // Đã xóa hoàn toàn margin: 4 để tránh xung đột tính toán kích thước chiều ngang với layout cha
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden', // Bo tròn khít góc tránh nội dung con tràn ra ngoài
  },

  imgWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    backgroundColor: Colors.neutral[100],
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  imgLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },

  freeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: Spacing.borderRadius.sm,
  },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  content: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 10, // Co nhẹ lề 2 bên để tăng diện tích hiển thị text cho 2 cột
    paddingBottom: 10,
  },
  title: {
    fontSize: 13, // Giảm nhẹ xuống 13 để cân đối hài hòa trên màn hình nhỏ hiển thị 2 cột
    fontWeight: '600',
    lineHeight: 18,
    minHeight: 36,
    flexShrink: 1,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Căn chân đều theo trục dọc cho cân đối với nút bấm
    justifyContent: 'space-between',
    marginTop: 'auto',
    gap: 4,
  },
  priceBlock: {
    flex: 1,
    gap: 1,
  },
  priceCurrent: {
    fontSize: 14,
    fontWeight: '800',
  },
  originalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Tự động rớt dòng thông minh khi tên mệnh giá tiền quá dài ở màn hình hẹp
    gap: 4,
  },
  priceOriginal: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  discountChip: {
    backgroundColor: Colors.error + '12',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  discountChipText: {
    color: Colors.error,
    fontSize: 10,
    fontWeight: '700',
  },

  plusBtnContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusBtn: {
    width: 34, // Tinh chỉnh kích cỡ vàng 34x34px tối ưu nút bấm cho 2 sản phẩm/hàng
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    // Đổ bóng màu đỏ cao cấp và có chiều sâu
    shadowColor: MEKO_RED,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },

  logoImage: {
    width: AppConfig.courseCard.logoWidth || 28,
    height: AppConfig.courseCard.logoHeight || 28,
  },

  toast: {
    position: 'absolute',
    bottom: 50,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 20,
  },
  toastText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
