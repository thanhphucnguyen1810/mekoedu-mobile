/**
 * src/utils/skuUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tiện ích xử lý SKU + skuOptions từ Liferay Commerce.
 *
 * Cấu trúc mỗi SKU:
 *   { id, sku, price, skuOptions: [{ skuOptionKey, skuOptionName, skuOptionValueKey, skuOptionValueNames }] }
 *
 * Mục tiêu:
 *   1. groupOptionsByKey()  → gom các option thành nhóm (Màu sắc, Size, ...)
 *   2. findMatchingSku()    → tìm SKU khớp với map lựa chọn hiện tại
 *   3. isSelectionComplete()→ kiểm tra đã chọn đủ chưa
 */

export interface SkuOptionValue {
  valueKey: string;       // "do", "vang", "s", "m", "l"
  valueName: string;      // "Đỏ", "Vàng", "S", "M", "L"
  valueId: number;        // skuOptionValueId
}

export interface SkuOptionGroup {
  optionKey: string;      // "mau-sac", "size"
  optionName: string;     // "Màu sắc", "Size"
  optionId: number;       // skuOptionId
  values: SkuOptionValue[];
}

/** Map: optionKey → valueKey đang chọn */
export type SkuSelection = Record<string, string>;

/**
 * Gom tất cả skuOptions của toàn bộ SKU list thành danh sách nhóm option.
 * Dedup theo optionKey + valueKey để không bị trùng.
 */
export function groupOptionsByKey(skus: any[]): SkuOptionGroup[] {
  const groupMap = new Map<string, SkuOptionGroup>();

  for (const sku of skus) {
    if (!sku.purchasable && !sku.published) continue;
    for (const opt of (sku.skuOptions ?? [])) {
      const optKey: string = opt.skuOptionKey;
      if (!groupMap.has(optKey)) {
        groupMap.set(optKey, {
          optionKey: optKey,
          optionName: opt.skuOptionName,
          optionId: opt.skuOptionId,
          values: [],
        });
      }
      const group = groupMap.get(optKey)!;
      const valueKey: string = opt.skuOptionValueKey;
      const alreadyHas = group.values.some((v) => v.valueKey === valueKey);
      if (!alreadyHas) {
        group.values.push({
          valueKey,
          valueName: opt.skuOptionValueNames?.[0] ?? valueKey,
          valueId: opt.skuOptionValueId,
        });
      }
    }
  }

  return Array.from(groupMap.values());
}

/**
 * Tìm SKU khớp với selection hiện tại.
 * SKU khớp khi TẤT CẢ các option trong selection đều match.
 */
export function findMatchingSku(skus: any[], selection: SkuSelection): any | null {
  const selectedEntries = Object.entries(selection);
  if (selectedEntries.length === 0) return null;

  return (
    skus.find((sku) => {
      if (!sku.purchasable) return false;
      return selectedEntries.every(([optKey, valueKey]) => {
        return sku.skuOptions?.some(
          (opt: any) =>
            opt.skuOptionKey === optKey && opt.skuOptionValueKey === valueKey
        );
      });
    }) ?? null
  );
}

/**
 * Kiểm tra đã chọn đủ tất cả nhóm option chưa.
 */
export function isSelectionComplete(
  groups: SkuOptionGroup[],
  selection: SkuSelection
): boolean {
  return groups.every((g) => !!selection[g.optionKey]);
}

/**
 * Lấy giá hiển thị từ SKU object trả về bởi Liferay.
 */
export function getSkuPrice(sku: any): { price: number; promoPrice?: number } {
  const priceObj = sku?.price;
  if (!priceObj) return { price: 0 };
  return {
    price: priceObj.price ?? 0,
    promoPrice:
      priceObj.promoPrice && priceObj.promoPrice < (priceObj.price ?? 0)
        ? priceObj.promoPrice
        : undefined,
  };
}

export function formatVND(value: number): string {
  if (value === 0) return "Miễn phí";
  return value.toLocaleString("vi-VN") + "đ";
}
