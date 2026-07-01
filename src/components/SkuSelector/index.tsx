/**
 * src/components/SkuSelector/index.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Hiển thị các nhóm option (Màu sắc, Size...) dạng chip có thể chọn.
 * Dùng trong CourseDetailScreen.
 *
 * Props:
 *   skus        — mảng SKU từ Liferay (có skuOptions)
 *   selection   — map optionKey → valueKey đang chọn
 *   onChange    — callback khi chọn 1 option
 *   selectedSku — SKU đang match (để hiển thị giá tương ứng)
 */

import { Colors } from "@/src/theme";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SkuOptionGroup,
  SkuSelection,
  formatVND,
  getSkuPrice,
  groupOptionsByKey,
} from "@/src/utils/skuUtils";

interface Props {
  skus: any[];
  selection: SkuSelection;
  onChange: (optionKey: string, valueKey: string) => void;
  selectedSku?: any | null;
}

export function SkuSelector({ skus, selection, onChange, selectedSku }: Props) {
  const groups: SkuOptionGroup[] = React.useMemo(
    () => groupOptionsByKey(skus),
    [skus]
  );

  if (groups.length === 0) return null;

  const { price, promoPrice } = selectedSku
    ? getSkuPrice(selectedSku)
    : { price: 0, promoPrice: undefined };

  return (
    <View style={styles.container}>
      {/* Giá thay đổi theo SKU đang chọn */}
      {selectedSku && (
        <View style={styles.priceRow}>
          <Text style={styles.priceMain}>
            {formatVND(promoPrice ?? price)}
          </Text>
          {promoPrice !== undefined && price > 0 && (
            <Text style={styles.priceOld}>{formatVND(price)}</Text>
          )}
        </View>
      )}

      {groups.map((group) => (
        <View key={group.optionKey} style={styles.group}>
          {/* Tên nhóm + value đang chọn */}
          <View style={styles.groupHeader}>
            <Text style={styles.groupLabel}>{group.optionName}</Text>
            {selection[group.optionKey] && (
              <Text style={styles.selectedValue}>
                {group.values.find(
                  (v) => v.valueKey === selection[group.optionKey]
                )?.valueName ?? ""}
              </Text>
            )}
          </View>

          {/* Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {group.values.map((val) => {
              const isSelected = selection[group.optionKey] === val.valueKey;

              // Kiểm tra value này có tạo thành SKU hợp lệ không
              // (kết hợp với các option đã chọn khác)
              const testSelection = { ...selection, [group.optionKey]: val.valueKey };
              const wouldMatchSku = skus.some((sku) =>
                sku.purchasable &&
                Object.entries(testSelection).every(([k, v]) =>
                  sku.skuOptions?.some(
                    (o: any) => o.skuOptionKey === k && o.skuOptionValueKey === v
                  )
                )
              );
              const isUnavailable = !wouldMatchSku && Object.keys(testSelection).length === groups.length;

              return (
                <TouchableOpacity
                  key={val.valueKey}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected,
                    isUnavailable && styles.chipUnavailable,
                  ]}
                  onPress={() => onChange(group.optionKey, val.valueKey)}
                  activeOpacity={0.75}
                  disabled={isUnavailable}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextSelected,
                      isUnavailable && styles.chipTextUnavailable,
                    ]}
                  >
                    {val.valueName}
                  </Text>
                  {isUnavailable && <View style={styles.strikethrough} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  priceMain: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primary[600],
  },
  priceOld: {
    fontSize: 13,
    color: Colors.neutral[400],
    textDecorationLine: "line-through",
  },

  group: {
    gap: 8,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  groupLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.neutral[700],
  },
  selectedValue: {
    fontSize: 13,
    color: Colors.primary[600],
    fontWeight: "600",
  },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.background.primary,
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 44,
  },
  chipSelected: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  chipUnavailable: {
    borderColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[50],
    opacity: 0.55,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.neutral[700],
  },
  chipTextSelected: {
    color: Colors.primary[600],
  },
  chipTextUnavailable: {
    color: Colors.neutral[400],
  },
  // Gạch chéo cho unavailable
  strikethrough: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.neutral[300],
    transform: [{ rotate: "-20deg" }],
  },
});
