// app/(tabs)/courses.tsx
import CourseCard from "@/src/components/CourseCard";
import { Skeleton } from "@/src/components/Skeleton";
import {
  FilterModal,
  FilterState,
  SORT_OPTIONS,
  applyClientFilter,
  buildDefaultFilter,
} from "@/src/components/catalog/FilterModal";
import { AppHeader } from "@/src/components/common/AppHeader";
import { AppText } from "@/src/components/common/AppText";
import { useLiferayCategories, useLiferayProducts } from "@/src/hooks/useLiferayCatalog";
import { Spacing, useTheme } from "@/src/theme";
import { CatalogProduct } from "@/src/types/liferay";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROOT_PADDING    = 8;
const AVAILABLE_WIDTH = SCREEN_WIDTH - ROOT_PADDING * 2;
const VISUAL_PAD      = Spacing.layout.screenHorizontal - ROOT_PADDING;
const CARD_GAP        = Spacing.layout.columnGap;
const NUM_COLUMNS     = 2;
const CARD_WIDTH      =
  (AVAILABLE_WIDTH - VISUAL_PAD * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type SortKey = (typeof SORT_OPTIONS)[number]["key"];

// ─── CategoryChip ─────────────────────────────────────────────────────────────
function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const press   = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 200, friction: 10 }).start();
  const release = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200, friction: 10 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={press} onPressOut={release}>
      <Animated.View style={[
        styles.chip,
        active
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { backgroundColor: c.bgSoft, borderColor: c.border },
        { transform: [{ scale }] },
      ]}>
        {active && <View style={[styles.chipDot, { backgroundColor: "#fff" }]} />}
        <AppText variant="caption" style={[
          styles.chipText,
          active ? { color: "#fff", fontWeight: "600" } : { color: c.textSub, fontWeight: "500" },
        ]}>
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const { c } = useTheme();

  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [activeSort,  setActiveSort]  = useState<SortKey>("newest");
  const [showFilter,   setShowFilter]   = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Filter state — default sẽ được set sau khi có absoluteMin/Max thật
  const [filter, setFilter] = useState<FilterState>({
    priceMin: 0, priceMax: Number.MAX_SAFE_INTEGER,
    skuOptions: {}, specs: {},
  });

  const { products: rawProducts, loading, error, hasMore, loadMore, applyFilters, refetch } =
    useLiferayProducts({ pageSize: 20 });
  const { categories } = useLiferayCategories();

  // ── Tính price range từ toàn bộ products đã load ─────────────────────────
  // Chỉ khoá priceInitedRef khi thực sự tìm được giá hợp lệ (tránh dính
  // fallback sai khiến range luôn dừng ở một hằng số cố định).
  const { absoluteMin, absoluteMax, hasPriceData } = useMemo(() => {
    let mn = Infinity, mx = 0;
    for (const p of rawProducts) {
      const skus: any[] = (p as any).skus ?? [];
      for (const sku of skus) {
        const pr: number = sku.price?.price ?? 0;
        const pm: number = sku.price?.promoPrice ?? 0;
        const eff = pm > 0 && pm < pr ? pm : pr;
        if (eff > 0) { if (eff < mn) mn = eff; if (eff > mx) mx = eff; }
      }
    }
    const found = mx > 0;
    return {
      absoluteMin: found ? mn : 0,
      absoluteMax: found ? mx : 0,
      hasPriceData: found,
    };
  }, [rawProducts]);

  const priceInitedRef = useRef(false);
  if (!priceInitedRef.current && hasPriceData) {
    priceInitedRef.current = true;
    setFilter(buildDefaultFilter(absoluteMin, absoluteMax));
  }

  // ── Apply client-side filter ───────────────────────────────────────────────
  const displayProducts = useMemo(() => {
    let filtered = applyClientFilter(rawProducts, filter, absoluteMin, absoluteMax);
    // Sort client-side cho price
    if (activeSort === 'price_asc') {
      filtered = [...filtered].sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (activeSort === 'price_desc') {
      filtered = [...filtered].sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    }
    return filtered;
  }, [rawProducts, filter, absoluteMin, absoluteMax, activeSort]);

  // ── Đếm active filter (không tính sort — sort có nút riêng) ───────────────
  const isDefaultPrice = filter.priceMin <= absoluteMin && filter.priceMax >= absoluteMax;
  const activeFilterCount =
    (isDefaultPrice ? 0 : 1) +
    Object.values(filter.skuOptions).filter(v => v.length > 0).length +
    Object.values(filter.specs).filter(v => v.length > 0).length;

  const isSortActive = activeSort !== "newest";
  // ─── Helper ──────────────────────────────────────────────────────────────────
  function getEffectivePrice(product: CatalogProduct): number {
    const skus: any[] = (product as any).skus ?? [];
    for (const sku of skus) {
      const pr = sku.price?.price ?? 0;
      const pm = sku.price?.promoPrice ?? 0;
      const eff = pm > 0 && pm < pr ? pm : pr;
      if (eff > 0) return eff;
    }
    return (product as any).price ?? 0;
  }


  const handleCategory = useCallback(
    (catId: number | undefined) => {
      setActiveCatId(catId);
      applyFilters({ categoryId: catId, sort: activeSort });
      priceInitedRef.current = false; // reset price range khi đổi category
    },
    [applyFilters, activeSort]
  );

  const handleApplyFilter = useCallback(
    (newFilter: FilterState) => {
      setFilter(newFilter);
    },
    []
  );

  const handleSortChange = useCallback(
    (sortKey: string) => {
      setActiveSort(sortKey as SortKey);
      applyFilters({ categoryId: activeCatId, sort: sortKey });
    },
    [activeCatId, applyFilters]
  );

  const handleCardPress = (item: CatalogProduct) =>
    router.push({
      pathname: "/course/[id]",
      params: { id: item.productId ?? item.id, source: "liferay" },
    });

  // ── Sub-renders ────────────────────────────────────────────────────────────
  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.catList, { paddingHorizontal: VISUAL_PAD }]}
    >
      <CategoryChip label="Tất cả" active={activeCatId === undefined} onPress={() => handleCategory(undefined)} />
      {categories.map(cat => (
        <CategoryChip
          key={cat.id}
          label={cat.name}
          active={activeCatId === cat.id}
          onPress={() => handleCategory(cat.id)}
        />
      ))}
    </ScrollView>
  );

  // 2 nút riêng biệt: Sắp xếp (swap-vertical-outline, mở dropdown nhanh)
  // và Lọc (funnel-outline, mở FilterModal chỉ còn phần lọc).
  const renderFilterBar = () => (
    <View style={[styles.filterBar, { paddingHorizontal: VISUAL_PAD }]}>
      <TouchableOpacity
        style={[
          styles.iconBtn,
          {
            backgroundColor: isSortActive ? c.primary : c.bgSoft,
            borderColor: isSortActive ? c.primary : c.border,
            marginRight: 8,
          },
        ]}
        onPress={() => setShowSortMenu(v => !v)}
        activeOpacity={0.8}
      >
        <Ionicons name="swap-vertical-outline" size={18} color={isSortActive ? "#fff" : c.text} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.iconBtn,
          {
            backgroundColor: activeFilterCount > 0 ? c.primary : c.bgSoft,
            borderColor: activeFilterCount > 0 ? c.primary : c.border,
          },
        ]}
        onPress={() => setShowFilter(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="funnel-outline" size={18} color={activeFilterCount > 0 ? "#fff" : c.text} />
        {activeFilterCount > 0 && (
          <View style={styles.filterBadge}>
            <AppText style={styles.filterBadgeText}>{activeFilterCount}</AppText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: VISUAL_PAD }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={[styles.row, { marginBottom: CARD_GAP }]}>
          <Skeleton height={200} width={CARD_WIDTH} style={{ borderRadius: 12 }} />
          <Skeleton height={200} width={CARD_WIDTH} style={{ borderRadius: 12, marginLeft: CARD_GAP }} />
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item, index }: { item: CatalogProduct; index: number }) => {
    const isRight = index % NUM_COLUMNS === 1;
    return (
      <View style={[styles.cardWrapper, { width: CARD_WIDTH }, isRight && { marginLeft: CARD_GAP }]}>
        <CourseCard course={item} onPress={() => handleCardPress(item)} />
      </View>
    );
  };

  const ListHeader = () => (
    <View style={{ backgroundColor: c.bgSoft }}>
      {renderCategories()}
      {renderFilterBar()}
    </View>
  );

  const ListEmpty = () =>
    loading ? null : (
      <View style={styles.emptyState}>
        <AppText style={styles.emptyEmoji}>🔎</AppText>
        <AppText variant="h4" style={[styles.emptyTitle, { color: c.text }]}>
          Không tìm thấy kết quả
        </AppText>
        <AppText variant="body" style={[styles.emptyDesc, { color: c.textSub }]}>
          Thử thay đổi bộ lọc hoặc danh mục
        </AppText>
        <TouchableOpacity
          style={[styles.emptyBtn, { borderColor: c.primary, backgroundColor: c.primary + "12" }]}
          onPress={() => {
            setActiveCatId(undefined);
            setFilter(buildDefaultFilter(absoluteMin, absoluteMax));
            setActiveSort("newest");
            applyFilters({ categoryId: undefined, sort: "newest" });
            setShowFilter(false);
            setShowSortMenu(false);
          }}
        >
          <AppText style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>Xóa bộ lọc</AppText>
        </TouchableOpacity>
      </View>
    );

  const ListFooter = () => {
    if (loading && rawProducts.length === 0) return null;
    if (loading)
      return <View style={styles.footerLoader}><ActivityIndicator size="small" color={c.primary} /></View>;

    if (hasMore && displayProducts.length > 0) {
      return (
        <TouchableOpacity
          style={[styles.loadMoreBtn, { borderColor: c.primary, backgroundColor: c.primary + "12", marginHorizontal: VISUAL_PAD }]}
          onPress={loadMore}
        >
          <AppText style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>Xem thêm ↓</AppText>
        </TouchableOpacity>
      );
    }

    if (displayProducts.length > 0) {
      return (
        <View style={[styles.endRow, { paddingHorizontal: VISUAL_PAD }]}>
          <View style={[styles.endLine, { backgroundColor: c.border }]} />
          <AppText variant="caption" style={{ color: c.textSub }}>Đã hiển thị tất cả</AppText>
          <View style={[styles.endLine, { backgroundColor: c.border }]} />
        </View>
      );
    }
    return null;
  };

  if (error && rawProducts.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <StatusBar barStyle="dark-content" />
        <AppHeader title="Cửa hàng" showCart isSearchable placeholder="Tìm kiếm sản phẩm..." />
        <View style={[styles.errorWrap, { backgroundColor: c.bgSoft }]}>
          <View style={[styles.errorCard, { backgroundColor: c.bg, borderColor: c.border }]}>
            <AppText style={styles.errorEmoji}>⚠️</AppText>
            <AppText variant="h4" style={[styles.emptyTitle, { color: c.text }]}>Không thể tải dữ liệu</AppText>
            <AppText variant="body" style={[styles.emptyDesc, { color: c.textSub }]}>{error}</AppText>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: c.primary }]} onPress={refetch}>
              <AppText style={{ color: "#fff", fontWeight: "600" }}>Thử lại</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bgSoft }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <AppHeader title="Cửa hàng" showCart isSearchable placeholder="Tìm kiếm sản phẩm..." />

      {loading && rawProducts.length === 0 ? (
        <ScrollView>
          <ListHeader />
          {renderSkeleton()}
        </ScrollView>
      ) : (
        <FlatList
          data={displayProducts}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ paddingHorizontal: VISUAL_PAD, paddingBottom: 40, paddingTop: 4 }}
          columnWrapperStyle={{ marginBottom: CARD_GAP }}
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<ListEmpty />}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl
              refreshing={loading && rawProducts.length > 0}
              onRefresh={refetch}
              tintColor={c.primary}
              colors={[c.primary]}
            />
          }
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={6}
          windowSize={5}
          onScrollBeginDrag={() => setShowSortMenu(false)}
        />
      )}

      {/* Dropdown sắp xếp nhanh */}
      {showSortMenu && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSortMenu(false)} />
          <View
            style={[
              styles.sortMenu,
              { backgroundColor: c.bg, borderColor: c.border, top: 108, right: VISUAL_PAD },
            ]}
          >
            {SORT_OPTIONS.map((opt, i) => {
              const active = activeSort === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sortMenuItem,
                    i < SORT_OPTIONS.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: c.border },
                  ]}
                  onPress={() => {
                    handleSortChange(opt.key);
                    setShowSortMenu(false);
                  }}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={14}
                    color={active ? c.primary : c.textSub}
                    style={{ marginRight: 8 }}
                  />
                  <AppText style={{ flex: 1, fontSize: 13, color: active ? c.primary : c.text, fontWeight: active ? "700" : "500" }}>
                    {opt.label}
                  </AppText>
                  {active && <Ionicons name="checkmark" size={14} color={c.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        activeSort={activeSort}
        onSortChange={handleSortChange}
        showSort={false}
        allProducts={rawProducts}
        filter={filter}
        onFilterChange={handleApplyFilter}
        absoluteMin={absoluteMin}
        absoluteMax={absoluteMax}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  catList: { gap: 8, paddingVertical: 10 },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1, gap: 4,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12 },
  filterBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 6, marginBottom: 10,
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1, borderColor: "#eee",
  },
  filterBadgeText: { fontSize: 9, fontWeight: "700", color: "#333" },
  sortMenu: {
    position: "absolute",
    minWidth: 170,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  sortMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  row: { flexDirection: "row" },
  cardWrapper: {},
  footerLoader: { paddingVertical: 20, alignItems: "center" },
  loadMoreBtn: {
    paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
    alignItems: "center", marginVertical: 16,
  },
  endRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 20 },
  endLine: { flex: 1, height: 0.5 },
  emptyState: { alignItems: "center", paddingHorizontal: 32, paddingTop: 48 },
  emptyEmoji: { fontSize: 36, marginBottom: 12 },
  emptyTitle: { marginBottom: 8, textAlign: "center" },
  emptyDesc: { textAlign: "center", lineHeight: 22, marginBottom: 20 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorCard: { width: "100%", alignItems: "center", borderRadius: 20, padding: 28, borderWidth: 1 },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  retryBtn: { paddingHorizontal: 32, paddingVertical: 11, borderRadius: 10 },
});
