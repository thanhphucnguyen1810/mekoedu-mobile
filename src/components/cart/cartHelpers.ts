import { CartItem } from '@/src/store/slices/cartSlice';

export const fmtVND = (n: number) =>
  n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

export const effectivePrice = (item: CartItem) =>
  item.promoPrice && item.promoPrice > 0 && item.promoPrice < item.price
    ? item.promoPrice
    : item.price;

export const discountPct = (item: CartItem) =>
  item.promoPrice && item.promoPrice < item.price
    ? Math.round((1 - item.promoPrice / item.price) * 100)
    : 0;
    