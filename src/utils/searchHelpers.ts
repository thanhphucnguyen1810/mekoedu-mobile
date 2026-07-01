// src/utils/searchHelpers.ts
import type { CatalogProduct } from "@/src/types/liferay";

// ─── Price helpers ────────────────────────────────────────────────────────────

/**
 * Lấy giá hiển thị (ưu tiên promoPrice) từ 1 CatalogProduct.
 * Liferay trả `sku.price` là OBJECT ({ price, promoPrice, ... }), không phải số,
 * nên phải bóc tách đúng field, không dùng trực tiếp như number.
 */
export function getDisplayPrice(item: CatalogProduct): { price: number; promoPrice?: number } {
  const rawSkuPrice: any = (item as any).skus?.[0]?.price;
  if (rawSkuPrice && typeof rawSkuPrice === "object") {
    const price = rawSkuPrice.price ?? 0;
    const promo = rawSkuPrice.promoPrice;
    return {
      price,
      promoPrice: typeof promo === "number" && promo > 0 && promo < price ? promo : undefined,
    };
  }
  // fallback nếu API trả thẳng field price ở product (một số version/list rút gọn)
  const price = (item as any).price ?? 0;
  return { price };
}

export function formatVnd(v: number): string {
  return v === 0 ? "Miễn phí" : `${v.toLocaleString("vi-VN")} đ`;
}

// ─── Brand helpers ────────────────────────────────────────────────────────────

/**
 * Cố gắng lấy tên thương hiệu của 1 sản phẩm.
 *
 * ⚠️ Liferay chưa chắc có field "brand" tường minh — thứ tự ưu tiên:
 * 1. Field brand/manufacturer nếu backend có cấu hình sẵn.
 * 2. Category thuộc vocabulary có tên chứa "brand"/"thương hiệu".
 * 3. Fallback: đoán từ 1-2 từ viết hoa đầu tiên trong tên sản phẩm
 *    (VD: "Banila Co Original Cho Mọi Loại Da" → "Banila Co").
 * Nếu hệ thống của bạn có field brand riêng, chỉ cần sửa lại hàm này.
 */
export function getProductBrand(item: CatalogProduct): string | null {
  const anyItem = item as any;

  const explicitBrand = anyItem.brand || anyItem.manufacturer;
  if (explicitBrand) return String(explicitBrand).trim();

  const brandCategory = anyItem.categories?.find((c: any) => {
    const vocab = (c.vocabulary ?? c.vocabularyName ?? "").toString().toLowerCase();
    return vocab.includes("brand") || vocab.includes("thương hiệu") || vocab.includes("thuong hieu");
  });
  if (brandCategory?.name) return String(brandCategory.name).trim();

  const match = (item.name ?? "").match(/^([A-ZÀ-Ỹ][a-zà-ỹ]*(?:\s[A-ZÀ-Ỹ][a-zà-ỹ]*){0,1})/);
  return match?.[1]?.trim() || null;
}

export function extractBrands(products: CatalogProduct[]): string[] {
  const set = new Set<string>();
  products.forEach((p) => {
    const brand = getProductBrand(p);
    if (brand) set.add(brand);
  });
  return Array.from(set).slice(0, 8);
}
