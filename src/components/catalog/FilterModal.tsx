// src/components/catalog/FilterModal.tsx
// Filter client-side: giá (range slider), phân loại SKU, thông số sản phẩm
// Sort server-side: tên A-Z/Z-A, giá tăng/giảm, mới nhất

import { AppText } from "@/src/components/common/AppText";
import { useTheme } from "@/src/theme";
import { CatalogProduct } from "@/src/types/liferay";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterState {
  priceMin: number;
  priceMax: number;
  skuOptions: Record<string, string[]>; // { "mau": ["xanh-da-tri-nht", "vang"] }
  specs: Record<string, string[]>;      // { "RAM": ["16 GB"] }
}

export interface SortOption {
  key: string;
  label: string;
  icon: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { key: "newest",     label: "Mới nhất",     icon: "time-outline" },
  { key: "name_asc",   label: "Tên A → Z",    icon: "text-outline" },
  { key: "name_desc",  label: "Tên Z → A",    icon: "text-outline" },
  { key: "price_asc",  label: "Giá tăng dần", icon: "trending-up-outline" },
  { key: "price_desc", label: "Giá giảm dần", icon: "trending-down-outline" },
];

export function buildDefaultFilter(priceMin: number, priceMax: number): FilterState {
  return { priceMin, priceMax, skuOptions: {}, specs: {} };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractPriceRange(products: CatalogProduct[]): { min: number; max: number } {
  let min = Infinity, max = 0;
  for (const p of products) {
    const skus: any[] = (p as any).skus ?? [];
    for (const sku of skus) {
      const price: number = sku.price?.price ?? 0;
      const promo: number = sku.price?.promoPrice ?? 0;
      const effective = promo > 0 && promo < price ? promo : price;
      if (effective > 0) {
        if (effective < min) min = effective;
        if (effective > max) max = effective;
      }
    }
    // fallback nếu không có skus
    const fp: number = (p as any).price ?? 0;
    if (fp > 0) {
      if (fp < min) min = fp;
      if (fp > max) max = fp;
    }
  }
  return {
    min: min === Infinity ? 0 : min,
    max: max === 0 ? 100_000_000 : max,
  };
}

/** Gom skuOptions theo optionKey → set các value */
function extractSkuOptions(products: CatalogProduct[]): Record<string, { name: string; values: { key: string; label: string }[] }> {
  const map: Record<string, { name: string; valuesMap: Map<string, string> }> = {};
  for (const p of products) {
    const skus: any[] = (p as any).skus ?? [];
    for (const sku of skus) {
      for (const opt of (sku.skuOptions ?? [])) {
        const optKey: string = opt.skuOptionKey ?? opt.key ?? "";
        const optName: string = opt.skuOptionName ?? optKey;
        const valKey: string = opt.skuOptionValueKey ?? String(opt.value ?? "");
        const valLabel: string = opt.skuOptionValueNames?.[0] ?? valKey;
        if (!optKey || !valKey) continue;
        if (!map[optKey]) map[optKey] = { name: optName, valuesMap: new Map() };
        map[optKey].valuesMap.set(valKey, valLabel);
      }
    }
  }
  const result: Record<string, { name: string; values: { key: string; label: string }[] }> = {};
  for (const [k, v] of Object.entries(map)) {
    result[k] = {
      name: v.name,
      values: Array.from(v.valuesMap.entries()).map(([key, label]) => ({ key, label })),
    };
  }
  return result;
}

/** Gom specifications theo title → set các value */
function extractSpecs(products: CatalogProduct[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const p of products) {
    const specs: any[] = (p as any).productSpecifications ?? [];
    for (const s of specs) {
      const title: string = (s.specificationTitle ?? s.specificationKey ?? "").trim();
      const value: string = (s.value ?? "").trim();
      if (!title || !value) continue;
      if (!map[title]) map[title] = new Set();
      map[title].add(value);
    }
  }
  const result: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) {
    if (v.size > 1) result[k] = Array.from(v).sort(); // chỉ hiện nếu có nhiều hơn 1 giá trị
  }
  return result;
}

// ─── Apply filter lên danh sách sản phẩm (export để dùng ở screen) ───────────

export function applyClientFilter(
  products: CatalogProduct[],
  filter: FilterState,
  absoluteMin: number,
  absoluteMax: number,
): CatalogProduct[] {
  const isDefaultPrice = filter.priceMin <= absoluteMin && filter.priceMax >= absoluteMax;
  const hasSkuFilter   = Object.values(filter.skuOptions).some(v => v.length > 0);
  const hasSpecFilter  = Object.values(filter.specs).some(v => v.length > 0);

  if (isDefaultPrice && !hasSkuFilter && !hasSpecFilter) return products;

  return products.filter(p => {
    // ── Giá ──
    if (!isDefaultPrice) {
      const skus: any[] = (p as any).skus ?? [];
      const prices = skus.map(s => {
        const pr = s.price?.price ?? 0;
        const pm = s.price?.promoPrice ?? 0;
        return pm > 0 && pm < pr ? pm : pr;
      }).filter(x => x > 0);
      const fp: number = (p as any).price ?? 0;
      if (prices.length === 0 && fp > 0) prices.push(fp);
      const inRange = prices.some(pr => pr >= filter.priceMin && pr <= filter.priceMax);
      if (!inRange) return false;
    }

    // ── SKU options: mỗi optionKey là AND, values trong key là OR ──
    if (hasSkuFilter) {
      const skus: any[] = (p as any).skus ?? [];
      for (const [optKey, selectedValues] of Object.entries(filter.skuOptions)) {
        if (selectedValues.length === 0) continue;
        const match = skus.some(sku =>
          (sku.skuOptions ?? []).some((opt: any) =>
            (opt.skuOptionKey ?? opt.key) === optKey &&
            selectedValues.includes(opt.skuOptionValueKey ?? String(opt.value ?? ""))
          )
        );
        if (!match) return false;
      }
    }

    // ── Specs: mỗi title là AND, values trong title là OR ──
    if (hasSpecFilter) {
      const specs: any[] = (p as any).productSpecifications ?? [];
      for (const [title, selectedValues] of Object.entries(filter.specs)) {
        if (selectedValues.length === 0) continue;
        const match = specs.some(s =>
          (s.specificationTitle ?? s.specificationKey ?? "").trim() === title &&
          selectedValues.includes((s.value ?? "").trim())
        );
        if (!match) return false;
      }
    }

    return true;
  });
}

// ─── Price Range Slider ───────────────────────────────────────────────────────

const TRACK_W = SCREEN_WIDTH - 80;
const THUMB_R = 13;

function PriceSlider({
  min, max, valueMin, valueMax,
  onChange,
}: {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChange: (min: number, max: number) => void;
}) {
  const { c } = useTheme();
  const range = max - min || 1;

  const toX = (v: number) => ((v - min) / range) * TRACK_W;
  const toV = (x: number) => Math.round(min + (x / TRACK_W) * range);
  const clamp = (x: number) => Math.max(0, Math.min(TRACK_W, x));

  const leftX  = useRef(new Animated.Value(toX(valueMin))).current;
  const rightX = useRef(new Animated.Value(toX(valueMax))).current;
  const leftVal  = useRef(valueMin);
  const rightVal = useRef(valueMax);

  useEffect(() => {
    leftX.setValue(toX(valueMin));
    rightX.setValue(toX(valueMax));
    leftVal.current  = valueMin;
    rightVal.current = valueMax;
  }, [min, max]);

  const makePan = (side: "left" | "right") => {
    let startX = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX = side === "left" ? leftVal.current : rightVal.current;
        startX = toX(startX);
      },
      onPanResponderMove: (_, g) => {
        if (side === "left") {
          const nx = clamp(startX + g.dx);
          const nv = toV(nx);
          if (nv >= rightVal.current) return;
          leftX.setValue(nx);
          leftVal.current = nv;
        } else {
          const nx = clamp(startX + g.dx);
          const nv = toV(nx);
          if (nv <= leftVal.current) return;
          rightX.setValue(nx);
          rightVal.current = nv;
        }
      },
      onPanResponderRelease: () => {
        onChange(leftVal.current, rightVal.current);
      },
    });
  };

  const leftPan  = useRef(makePan("left")).current;
  const rightPan = useRef(makePan("right")).current;

  const fmt = (v: number) =>
    v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}tr`
      : `${(v / 1000).toFixed(0)}k`;

  return (
    <View style={{ paddingHorizontal: THUMB_R }}>
      {/* Labels */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
        <AppText style={{ fontSize: 13, color: c.primary, fontWeight: "600" }}>
          {fmt(valueMin)}
        </AppText>
        <AppText style={{ fontSize: 13, color: c.primary, fontWeight: "600" }}>
          {fmt(valueMax)}
        </AppText>
      </View>

      {/* Track */}
      <View style={{ height: THUMB_R * 2, justifyContent: "center" }}>
        {/* Background track */}
        <View style={[sliderSt.track, { backgroundColor: c.border }]} />

        {/* Active range */}
        <Animated.View
          style={[
            sliderSt.activeTrack,
            {
              backgroundColor: c.primary,
              left: Animated.add(leftX, THUMB_R),
              width: Animated.subtract(rightX, leftX),
            },
          ]}
        />

        {/* Left thumb */}
        <Animated.View
          {...leftPan.panHandlers}
          style={[
            sliderSt.thumb,
            {
              backgroundColor: c.primary,
              borderColor: "#fff",
              left: leftX,
            },
          ]}
        />

        {/* Right thumb */}
        <Animated.View
          {...rightPan.panHandlers}
          style={[
            sliderSt.thumb,
            {
              backgroundColor: c.primary,
              borderColor: "#fff",
              left: rightX,
            },
          ]}
        />
      </View>

      {/* Min / Max labels */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <AppText style={{ fontSize: 10, color: c.textSub }}>{fmt(min)}</AppText>
        <AppText style={{ fontSize: 10, color: c.textSub }}>{fmt(max)}</AppText>
      </View>
    </View>
  );
}

const sliderSt = StyleSheet.create({
  track: {
    position: "absolute",
    left: THUMB_R,
    right: THUMB_R,
    height: 3,
    borderRadius: 2,
  },
  activeTrack: {
    position: "absolute",
    height: 3,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB_R * 2,
    height: THUMB_R * 2,
    borderRadius: THUMB_R,
    borderWidth: 2.5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
  },
});

// ─── Chip chọn ───────────────────────────────────────────────────────────────

function OptionChip({
  label, selected, onPress,
}: {
  label: string; selected: boolean; onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        chipSt.chip,
        selected
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { backgroundColor: c.bgSoft, borderColor: c.border },
      ]}
    >
      {selected && (
        <Ionicons name="checkmark" size={11} color="#fff" style={{ marginRight: 3 }} />
      )}
      <AppText style={[chipSt.label, { color: selected ? "#fff" : c.textSub }]}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const chipSt = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 7,
    marginBottom: 7,
  },
  label: { fontSize: 12, fontWeight: "500" },
});

// ─── Section header với nút reset ────────────────────────────────────────────

function SectionHeader({
  title, canReset, onReset,
}: {
  title: string; canReset: boolean; onReset: () => void;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
      <AppText style={{ fontSize: 11, fontWeight: "700", color: c.textSub, letterSpacing: 0.7 }}>
        {title.toUpperCase()}
      </AppText>
      {canReset && (
        <TouchableOpacity onPress={onReset}>
          <AppText style={{ fontSize: 11, color: c.primary, fontWeight: "600" }}>Bỏ chọn</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── FilterModal ──────────────────────────────────────────────────────────────

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;

  // Sort (server-side)
  activeSort: string;
  onSortChange: (key: string) => void;
  /**
   * 🆕 Có hiển thị section "Sắp xếp" bên trong modal này hay không.
   * Đặt `false` khi màn hình đã có nút Sắp xếp riêng bên ngoài (icon riêng),
   * tránh trùng lặp 2 nơi cùng chỉnh sort. Mặc định `true` để không phá vỡ
   * những màn hình khác đang dùng modal này ở chế độ gộp chung.
   */
  showSort?: boolean;

  // Filter (client-side)
  allProducts: CatalogProduct[];     // toàn bộ products chưa filter để extract options
  filter: FilterState;
  onFilterChange: (f: FilterState) => void;

  // Absolute price range (từ tất cả products)
  absoluteMin: number;
  absoluteMax: number;
}

export function FilterModal({
  visible, onClose,
  activeSort, onSortChange, showSort = true,
  allProducts, filter, onFilterChange,
  absoluteMin, absoluteMax,
}: FilterModalProps) {
  const { c } = useTheme();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Local state — chỉ apply khi nhấn "Áp dụng"
  const [localFilter, setLocalFilter] = useState<FilterState>(filter);
  const [localSort,   setLocalSort]   = useState(activeSort);

  // Sync khi mở modal
  useEffect(() => {
    if (visible) {
      setLocalFilter(filter);
      setLocalSort(activeSort);
      Animated.spring(slideAnim, {
        toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Extract options từ allProducts
  const skuOptionDefs = useMemo(() => extractSkuOptions(allProducts), [allProducts]);
  const specDefs      = useMemo(() => extractSpecs(allProducts), [allProducts]);

  const isDefaultPrice =
    localFilter.priceMin <= absoluteMin && localFilter.priceMax >= absoluteMax;

  // Đếm số filter đang active (KHÔNG tính sort — sort có nút riêng bên ngoài)
  const activeFilterCount =
    (isDefaultPrice ? 0 : 1) +
    Object.values(localFilter.skuOptions).filter(v => v.length > 0).length +
    Object.values(localFilter.specs).filter(v => v.length > 0).length;

  const sortIsActive = showSort && localSort !== "newest";

  const handleApply = () => {
    if (showSort) onSortChange(localSort);
    onFilterChange(localFilter);
    onClose();
  };

  const handleResetAll = () => {
    const fresh = buildDefaultFilter(absoluteMin, absoluteMax);
    setLocalFilter(fresh);
    if (showSort) setLocalSort("newest");
  };

  // Toggle chip cho skuOptions
  const toggleSkuOption = (optKey: string, valKey: string) => {
    setLocalFilter(prev => {
      const cur = prev.skuOptions[optKey] ?? [];
      const next = cur.includes(valKey)
        ? cur.filter(v => v !== valKey)
        : [...cur, valKey];
      return { ...prev, skuOptions: { ...prev.skuOptions, [optKey]: next } };
    });
  };

  // Toggle chip cho specs
  const toggleSpec = (title: string, value: string) => {
    setLocalFilter(prev => {
      const cur = prev.specs[title] ?? [];
      const next = cur.includes(value)
        ? cur.filter(v => v !== value)
        : [...cur, value];
      return { ...prev, specs: { ...prev.specs, [title]: next } };
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={st.backdrop} onPress={onClose} />

      <Animated.View style={[st.sheet, { backgroundColor: c.bg, transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={[st.handle, { backgroundColor: c.border }]} />

        {/* Header */}
        <View style={[st.header, { borderBottomColor: c.border }]}>
          <AppText style={{ fontSize: 16, fontWeight: "700", color: c.text }}>
            {showSort ? "Lọc & Sắp xếp" : "Lọc sản phẩm"}
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {(activeFilterCount > 0 || sortIsActive) && (
              <TouchableOpacity onPress={handleResetAll}>
                <AppText style={{ fontSize: 13, color: c.primary, fontWeight: "600" }}>
                  Đặt lại
                </AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color={c.textSub} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

          {/* ── Sắp xếp (chỉ hiện khi showSort=true) ── */}
          {showSort && (
            <View style={st.section}>
              <SectionHeader
                title="Sắp xếp"
                canReset={localSort !== "newest"}
                onReset={() => setLocalSort("newest")}
              />
              <View style={st.chipWrap}>
                {SORT_OPTIONS.map(opt => (
                  <OptionChip
                    key={opt.key}
                    label={opt.label}
                    selected={localSort === opt.key}
                    onPress={() => setLocalSort(opt.key)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Giá ── */}
          {allProducts.length > 0 && absoluteMax > absoluteMin && (
            <View style={[st.section, showSort && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <SectionHeader
                title="Khoảng giá"
                canReset={!isDefaultPrice}
                onReset={() => setLocalFilter(prev => ({ ...prev, priceMin: absoluteMin, priceMax: absoluteMax }))}
              />
              <PriceSlider
                min={absoluteMin}
                max={absoluteMax}
                valueMin={localFilter.priceMin}
                valueMax={localFilter.priceMax}
                onChange={(mn, mx) => setLocalFilter(prev => ({ ...prev, priceMin: mn, priceMax: mx }))}
              />
            </View>
          )}

          {/* ── Phân loại SKU ── */}
          {Object.entries(skuOptionDefs).map(([optKey, def]) => {
            const selected = localFilter.skuOptions[optKey] ?? [];
            return (
              <View key={optKey} style={[st.section, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                <SectionHeader
                  title={def.name}
                  canReset={selected.length > 0}
                  onReset={() => setLocalFilter(prev => ({ ...prev, skuOptions: { ...prev.skuOptions, [optKey]: [] } }))}
                />
                <View style={st.chipWrap}>
                  {def.values.map(v => (
                    <OptionChip
                      key={v.key}
                      label={v.label}
                      selected={selected.includes(v.key)}
                      onPress={() => toggleSkuOption(optKey, v.key)}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          {/* ── Thông số sản phẩm ── */}
          {Object.entries(specDefs).map(([title, values]) => {
            const selected = localFilter.specs[title] ?? [];
            return (
              <View key={title} style={[st.section, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
                <SectionHeader
                  title={title}
                  canReset={selected.length > 0}
                  onReset={() => setLocalFilter(prev => ({ ...prev, specs: { ...prev.specs, [title]: [] } }))}
                />
                <View style={st.chipWrap}>
                  {values.map(v => (
                    <OptionChip
                      key={v}
                      label={v}
                      selected={selected.includes(v)}
                      onPress={() => toggleSpec(title, v)}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[st.footer, { borderTopColor: c.border, backgroundColor: c.bg }]}>
          <TouchableOpacity
            style={[st.applyBtn, { backgroundColor: c.primary }]}
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <AppText style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Áp dụng{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </AppText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.88,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center",
    marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
});
