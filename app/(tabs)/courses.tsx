// app/(tabs)/courses.tsx
import CourseCard from "@/src/components/CourseCard";
import { Skeleton } from "@/src/components/Skeleton";
import { AppHeader } from "@/src/components/common/AppHeader";
import { AppText } from "@/src/components/common/AppText";
import { useLiferayCategories, useLiferayProducts } from "@/src/hooks/useLiferayCatalog";
import { Spacing, useTheme } from "@/src/theme";
import { CatalogProduct } from "@/src/types/liferay";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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

// ─── Đồng bộ padding với FeaturedCoursesList ────────────────────────────────
const ROOT_PADDING = 8;
const AVAILABLE_WIDTH = SCREEN_WIDTH - (ROOT_PADDING * 2);
const VISUAL_PAD = Spacing.layout.screenHorizontal - ROOT_PADDING; // 16 - 8 = 8

const CARD_GAP = Spacing.layout.columnGap; // 12
const NUM_COLUMNS = 2;

const CARD_WIDTH =
  (AVAILABLE_WIDTH - VISUAL_PAD * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

// ─── Types ───────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: "newest", label: "Mới nhất" },
  { key: "popular", label: "Phổ biến" },
  { key: "price_asc", label: "Giá thấp" },
  { key: "price_desc", label: "Giá cao" },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]["key"];

// ─── CategoryChip ─────────────────────────────────────────────────────────────
function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const press = () =>
    Animated.spring(scale, {
      toValue: 0.93,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  const release = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();

  return (
    <Pressable onPress={onPress} onPressIn={press} onPressOut={release}>
      <Animated.View
        style={[
          styles.chip,
          active
            ? { backgroundColor: c.primary, borderColor: c.primary }
            : { backgroundColor: c.bgSoft, borderColor: c.border },
          { transform: [{ scale }] },
        ]}
      >
        {active && <View style={[styles.chipDot, { backgroundColor: "#fff" }]} />}
        <AppText
          variant="caption"
          style={[
            styles.chipText,
            active
              ? { color: "#fff", fontWeight: "600" }
              : { color: c.textSub, fontWeight: "500" },
          ]}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CatalogScreen() {
  const { c, spacing, radius } = useTheme();

  const [searchText, setSearchText] = useState("");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const [activeSort, setActiveSort] = useState<SortKey>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { products, loading, error, hasMore, loadMore, applyFilters, refetch } =
    useLiferayProducts({ pageSize: 12 });
  const { categories } = useLiferayCategories();

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      applyFilters({ search: text, categoryId: activeCatId });
    },
    [activeCatId, applyFilters]
  );

  const handleCategory = useCallback(
    (catId: number | undefined) => {
      setActiveCatId(catId);
      applyFilters({ search: searchText, categoryId: catId });
    },
    [searchText, applyFilters]
  );

  const handleCardPress = (item: CatalogProduct) =>
    router.push({
      pathname: "/course/[id]",
      params: { id: item.productId ?? item.id, source: "liferay" },
    });

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.key === activeSort)?.label ?? "Sắp xếp";

  // ── Sub-renders ────────────────────────────────────────────────────────────
  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.catList, { paddingHorizontal: VISUAL_PAD }]}
    >
      <CategoryChip
        label="Tất cả"
        active={activeCatId === undefined}
        onPress={() => handleCategory(undefined)}
      />
      {categories.map((cat) => (
        <CategoryChip
          key={cat.id}
          label={cat.name}
          active={activeCatId === cat.id}
          onPress={() => handleCategory(cat.id)}
        />
      ))}
    </ScrollView>
  );

  const renderFilterBar = () => (
    <View style={[styles.filterBar, { paddingHorizontal: VISUAL_PAD }]}>
      <AppText variant="caption" style={{ color: c.textSub }}>
        {products.length} kết quả
      </AppText>
      <TouchableOpacity
        style={[
          styles.sortBtn,
          {
            backgroundColor: showSortMenu ? c.primary : c.bgSoft,
            borderColor: showSortMenu ? c.primary : c.border,
          },
        ]}
        onPress={() => setShowSortMenu((v) => !v)}
      >
        <AppText
          style={{
            color: showSortMenu ? "#fff" : c.text,
            fontSize: 12,
            fontWeight: "600",
          }}
        >
          {activeSortLabel}
        </AppText>
        <AppText
          style={{
            color: showSortMenu ? "#fff" : c.text,
            fontSize: 10,
          }}
        >
          ▾
        </AppText>
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View style={{ paddingHorizontal: VISUAL_PAD }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <View key={i} style={[styles.row, { marginBottom: CARD_GAP }]}>
          <Skeleton height={200} width={CARD_WIDTH} style={{ borderRadius: 12 }} />
          <Skeleton
            height={200}
            width={CARD_WIDTH}
            style={{ borderRadius: 12, marginLeft: CARD_GAP }}
          />
        </View>
      ))}
    </View>
  );

  // ── FlatList renderers ─────────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: CatalogProduct; index: number }) => {
    const isRight = index % NUM_COLUMNS === 1;
    return (
      <View
        style={[
          styles.cardWrapper,
          { width: CARD_WIDTH },
          isRight && { marginLeft: CARD_GAP },
        ]}
      >
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
          Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
        </AppText>
        <TouchableOpacity
          style={[
            styles.emptyBtn,
            { borderColor: c.primary, backgroundColor: c.primary + "12" },
          ]}
          onPress={() => {
            handleSearch("");
            handleCategory(undefined);
          }}
        >
          <AppText style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>
            Xóa bộ lọc
          </AppText>
        </TouchableOpacity>
      </View>
    );

  const ListFooter = () => {
    if (loading && products.length === 0) return null;
    if (loading)
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      );
    if (hasMore)
      return (
        <TouchableOpacity
          style={[
            styles.loadMoreBtn,
            {
              borderColor: c.primary,
              backgroundColor: c.primary + "12",
              marginHorizontal: VISUAL_PAD,
            },
          ]}
          onPress={loadMore}
        >
          <AppText style={{ color: c.primary, fontWeight: "600", fontSize: 13 }}>
            Xem thêm ↓
          </AppText>
        </TouchableOpacity>
      );
    if (products.length > 0)
      return (
        <View style={[styles.endRow, { paddingHorizontal: VISUAL_PAD }]}>
          <View style={[styles.endLine, { backgroundColor: c.border }]} />
          <AppText variant="caption" style={{ color: c.textSub }}>
            Đã hiển thị tất cả
          </AppText>
          <View style={[styles.endLine, { backgroundColor: c.border }]} />
        </View>
      );
    return null;
  };

  // ── Error state ────────────────────────────────────────────────────────────
  if (error && products.length === 0) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <StatusBar barStyle="dark-content" />
        <AppHeader
          title="Khóa học"
          showCart
          isSearchable
          placeholder="Tìm kiếm khóa học..."
          searchQuery={searchText}
          onSearchChange={handleSearch}
        />
        <View style={[styles.errorWrap, { backgroundColor: c.bgSoft }]}>
          <View
            style={[styles.errorCard, { backgroundColor: c.bg, borderColor: c.border }]}
          >
            <AppText style={styles.errorEmoji}>⚠️</AppText>
            <AppText variant="h4" style={[styles.errorTitle, { color: c.text }]}>
              Không thể tải dữ liệu
            </AppText>
            <AppText variant="body" style={[styles.errorDesc, { color: c.textSub }]}>
              {error}
            </AppText>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: c.primary, borderRadius: radius.md }]}
              onPress={refetch}
            >
              <AppText style={{ color: "#fff", fontWeight: "600" }}>Thử lại</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: c.bgSoft }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />

      <AppHeader
        title="Sản phẩm"
        showCart
        isSearchable
        placeholder="Tìm kiếm sản phẩm..."
        searchQuery={searchText}
        onSearchChange={handleSearch}
      />

      {loading && products.length === 0 ? (
        <ScrollView>
          <ListHeader />
          {renderSkeleton()}
        </ScrollView>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{
            paddingHorizontal: VISUAL_PAD,
            paddingBottom: 40,
            paddingTop: 4,
          }}
          columnWrapperStyle={{ marginBottom: CARD_GAP }}
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<ListEmpty />}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl
              refreshing={loading && products.length > 0}
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

      {/* Sort dropdown */}
      {showSortMenu && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSortMenu(false)} />
          <View
            style={[
              styles.sortMenu,
              {
                backgroundColor: c.bg,
                borderColor: c.border,
                top: 110, // Adjust based on header + filter bar height
                right: VISUAL_PAD,
              },
            ]}
          >
            {SORT_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.sortMenuItem,
                  i < SORT_OPTIONS.length - 1 && {
                    borderBottomWidth: 0.5,
                    borderBottomColor: c.border,
                  },
                ]}
                onPress={() => {
                  setActiveSort(opt.key);
                  setShowSortMenu(false);
                }}
              >
                <AppText
                  style={{
                    fontSize: 13,
                    color: activeSort === opt.key ? c.primary : c.text,
                    fontWeight: activeSort === opt.key ? "700" : "500",
                  }}
                >
                  {opt.label}
                </AppText>
                {activeSort === opt.key && (
                  <AppText style={{ color: c.primary, fontSize: 14, fontWeight: "700" }}>
                    ✓
                  </AppText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  catList: { gap: 8, paddingVertical: 10 },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginBottom: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
  },
  cardWrapper: {
    marginBottom: 0,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadMoreBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    marginVertical: 16,
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  endLine: {
    flex: 1,
    height: 0.5,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 48,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDesc: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  errorWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorCard: {
    width: "100%",
    alignItems: "center",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
  },
  errorEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  errorDesc: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  retryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 11,
  },
  sortMenu: {
    position: "absolute",
    minWidth: 140,
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
