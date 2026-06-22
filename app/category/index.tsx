import { AppHeader } from "@/src/components/common";
import { AppText } from "@/src/components/common/AppText";
import CourseCard from "@/src/components/CourseCard";
import { Skeleton } from "@/src/components/Skeleton";
import {
  getCategories,
  getProductsByCategory,
  getSubCategories,
} from "@/src/services/catalogService";
import { Spacing, useTheme } from "@/src/theme";
import { CatalogProduct, Category } from "@/src/types/liferay";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const PARENT_BOX_WIDTH = 80;
const CHILD_AREA_WIDTH =
  SCREEN_WIDTH - PARENT_BOX_WIDTH - StyleSheet.hairlineWidth;

const NUM_COLUMNS = 2;
const CARD_H_PAD = Spacing.sm;
const CARD_GAP = Spacing.sm;
const CARD_WIDTH =
  (CHILD_AREA_WIDTH - CARD_H_PAD * 2 - CARD_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

const PAGE_SIZE = 12;

// ─── CategoryImage ────────────────────────────────────────────────────────────
function CategoryImage({
  url,
  size,
  borderRadius,
  name,
  tintColor,
}: {
  url: string;
  size: number;
  borderRadius: number;
  name: string;
  tintColor: string;
}) {
  const [hasError, setHasError] = useState(false);
  const hasUrl = !!url && url.length > 0;

  if (!hasUrl || hasError) {
    return (
      <View
        style={[
          categoryImageStyles.fallback,
          { width: size, height: size, borderRadius },
        ]}
      >
        <Text
          style={{ color: tintColor, fontSize: size * 0.42, fontWeight: "800" }}
        >
          {(name?.[0] ?? "?").toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="cover"
      onError={() => setHasError(true)}
    />
  );
}

const categoryImageStyles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
});

// ─── SubCategoryChip ──────────────────────────────────────────────────────────
function SubCategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { c } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() =>
        Animated.spring(scaleAnim, {
          toValue: 0.93,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }).start()
      }
    >
      <Animated.View
        style={[
          chipStyles.chip,
          { borderWidth: 1, borderRadius: 20 },
          active
            ? { backgroundColor: c.primary, borderColor: c.primary }
            : { backgroundColor: c.bgSoft, borderColor: c.border },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <AppText
          variant="caption"
          style={[
            chipStyles.chipText,
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

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  chipText: { fontSize: 11 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const Categories = () => {
  const { c } = useTheme();

  // ── Category state ──────────────────────────────────────────────────────────
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [loadingParent, setLoadingParent] = useState(true);
  const [loadingChild, setLoadingChild] = useState(false);

  // ── Product state ───────────────────────────────────────────────────────────
  const [activeSubCat, setActiveSubCat] = useState<string>("all");

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [productError, setProductError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const isFirstProductLoad = useRef(true);
  pageRef.current = page;
  hasMoreRef.current = hasMore;

  // ── Load parent categories ──────────────────────────────────────────────────
  useEffect(() => {
    const loadParentCategories = async () => {
      try {
        const parents = await getCategories();
        setParentCategories(parents);
        if (parents.length > 0) {
          setSelectedParentId(parents[0].id);
          loadChildCategoriesFor(parents[0].id);
        }
      } catch (error) {
        console.warn("Load parent categories failed", error);
      } finally {
        setLoadingParent(false);
      }
    };
    loadParentCategories();
  }, []);

  // ── Load child categories ───────────────────────────────────────────────────
  const loadChildCategoriesFor = async (parentId: number) => {
    try {
      setLoadingChild(true);
      const children = await getSubCategories(parentId);
      setChildCategories(children);
    } catch (error) {
      console.warn("Load child categories failed", error);
      setChildCategories([]);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleParentPress = (parentId: number) => {
    if (parentId === selectedParentId) return;
    setSelectedParentId(parentId);
    setActiveSubCat("all");
    setProducts([]);
    setPage(1);
    setHasMore(true);
    isFirstProductLoad.current = true;
    loadChildCategoriesFor(parentId);
  };

  // ── Load products ───────────────────────────────────────────────────────────
  const loadProducts = useCallback(
    async (
      parentId: number,
      pageNum: number,
      append: boolean,
      subCatId: string
    ) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      if (!append) setLoadingProducts(true);
      try {
        const filterSubId =
          subCatId !== "all" ? Number(subCatId) : undefined;
        const result = await getProductsByCategory(
          parentId,
          pageNum,
          PAGE_SIZE,
          filterSubId
        );
        const items = result.items ?? [];
        const lastPage = result.lastPage ?? 1;

        if (append) {
          setProducts((prev) => {
            const existingIds = new Set(
              prev.map((p) => String(p.productId ?? p.id))
            );
            const newItems = items.filter(
              (p) => !existingIds.has(String(p.productId ?? p.id))
            );
            return [...prev, ...newItems];
          });
        } else {
          setProducts(items);
        }
        setPage(pageNum);
        setHasMore(pageNum < lastPage);
        setProductError(null);
      } catch (e: any) {
        setProductError(e?.message ?? "Không thể tải sản phẩm");
      } finally {
        fetchingRef.current = false;
        setLoadingProducts(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedParentId == null) return;
    loadProducts(selectedParentId, 1, false, "all");
  }, [selectedParentId]);

  useEffect(() => {
    if (isFirstProductLoad.current) {
      isFirstProductLoad.current = false;
      return;
    }
    if (selectedParentId == null) return;
    setProducts([]);
    setPage(1);
    setHasMore(true);
    loadProducts(selectedParentId, 1, false, activeSubCat);
  }, [activeSubCat]);

  const handleRefresh = async () => {
    if (selectedParentId == null) return;
    setRefreshing(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    await loadChildCategoriesFor(selectedParentId);
    await loadProducts(selectedParentId, 1, false, activeSubCat);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMoreRef.current || fetchingRef.current || selectedParentId == null)
      return;
    loadProducts(selectedParentId, pageRef.current + 1, true, activeSubCat);
  };

  const handleCardPress = (item: CatalogProduct) =>
    router.push({
      pathname: "/course/[id]",
      params: { id: item.productId ?? item.id, source: "liferay" },
    });

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderParentItem = (category: Category) => {
    const active = category.id === selectedParentId;

    return (
      <Pressable
        key={category.id}
        onPress={() => handleParentPress(category.id)}
        style={[
          styles.parentItem,
          {
            backgroundColor: active ? c.primary + "12" : "transparent",
            borderRightWidth: active ? 2.5 : 0,
            borderRightColor: c.primary,
            borderBottomColor: c.border,
          },
        ]}
      >
        <View
          style={[
            styles.parentIconWrap,
            {
              backgroundColor: active ? c.primary : c.bg,
              borderColor: active ? c.primary : c.border,
            },
          ]}
        >
          {category.imageUrl ? (
            <CategoryImage
              url={category.imageUrl}
              size={26}
              borderRadius={6}
              name={category.name}
              tintColor={active ? "#fff" : c.primary}
            />
          ) : (
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: active ? "#fff" : c.primary,
              }}
            >
              {(category.name?.[0] ?? "?").toUpperCase()}
            </Text>
          )}
        </View>

        <AppText
          style={[
            styles.parentText,
            {
              color: active ? c.primary : c.textSub,
              fontWeight: active ? "700" : "400",
            },
          ]}
          numberOfLines={2}
        >
          {category.name}
        </AppText>
      </Pressable>
    );
  };

  const SubCategoryBar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.filterBar,
        { paddingHorizontal: CARD_H_PAD, gap: Spacing.xs },
      ]}
    >
      <SubCategoryChip
        label="Tất cả"
        active={activeSubCat === "all"}
        onPress={() => setActiveSubCat("all")}
      />
      {childCategories.map((sub) => (
        <SubCategoryChip
          key={String(sub.id)}
          label={sub.name}
          active={activeSubCat === String(sub.id)}
          onPress={() => setActiveSubCat(String(sub.id))}
        />
      ))}
    </ScrollView>
  );

  const ProductSkeleton = (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.skeletonRow}>
          <Skeleton height={160} width={CARD_WIDTH} style={{ borderRadius: 10 }} />
          <Skeleton height={160} width={CARD_WIDTH} style={{ borderRadius: 10 }} />
        </View>
      ))}
    </View>
  );

  const renderProduct = ({
    item,
    index,
  }: {
    item: CatalogProduct;
    index: number;
  }) => {
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

  const ListHeader = (
    <View style={[styles.listHeader, { borderBottomColor: c.border }]}>
      {childCategories.length > 0 && SubCategoryBar}
    </View>
  );

  // ── Right panel ────────────────────────────────────────────────────────────
  const renderRightPanel = () => {
    if (loadingChild) {
      return (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      );
    }

    if (productError && products.length === 0 && !loadingProducts) {
      return (
        <View style={styles.centerBox}>
          <AppText style={{ fontSize: 28 }}>⚠️</AppText>
          <AppText
            variant="bodySmall"
            style={{ color: c.textSub, textAlign: "center", marginTop: 6 }}
          >
            {productError}
          </AppText>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: c.primary }]}
            onPress={handleRefresh}
          >
            <AppText style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
              Thử lại
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={products}
        keyExtractor={(item, index) =>
          `product-${String(item.productId ?? item.id ?? "")}-${index}`
        }
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={[
          styles.gridRow,
          { paddingHorizontal: CARD_H_PAD },
        ]}
        renderItem={renderProduct}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          loadingProducts ? (
            ProductSkeleton
          ) : (
            <View style={styles.emptyState}>
              <AppText style={{ fontSize: 26 }}>🔎</AppText>
              <AppText
                variant="bodySmall"
                style={{ color: c.textSub, textAlign: "center", marginTop: 6 }}
              >
                Chưa có khóa học trong danh mục này
              </AppText>
            </View>
          )
        }
        ListFooterComponent={
          hasMore && products.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.loadMoreBtn,
                {
                  borderColor: c.primary,
                  backgroundColor: c.primary + "10",
                  marginHorizontal: CARD_H_PAD,
                },
              ]}
              onPress={handleLoadMore}
              disabled={fetchingRef.current}
            >
              {fetchingRef.current ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <AppText
                  variant="bodySmall"
                  style={{ color: c.primary, fontWeight: "600" }}
                >
                  Xem thêm ↓
                </AppText>
              )}
            </TouchableOpacity>
          ) : products.length > 0 ? (
            <View style={[styles.endRow, { paddingHorizontal: CARD_H_PAD }]}>
              <View style={[styles.endLine, { backgroundColor: c.border }]} />
              <AppText variant="caption" style={{ color: c.textSub }}>
                Đã hiển thị tất cả
              </AppText>
              <View style={[styles.endLine, { backgroundColor: c.border }]} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // ── Root render ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.safeArea, { backgroundColor: c.bg }]}>
      <AppHeader showBack showCart title="Danh mục" />

      <View style={[styles.container, { borderTopColor: c.border }]}>
        {/* ── Left: parent categories ── */}
        <View style={[styles.parentBox, { backgroundColor: c.bgSoft }]}>
          {loadingParent ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {parentCategories.map(renderParentItem)}
            </ScrollView>
          )}
        </View>

        {/* ── Divider ── */}
        <View style={[styles.divider, { backgroundColor: c.border }]} />

        {/* ── Right: subcategory chips + products ── */}
        <View style={styles.rightBox}>{renderRightPanel()}</View>
      </View>
    </View>
  );
};

export default Categories;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  container: {
    flex: 1,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // ── Left panel ──
  parentBox: { width: PARENT_BOX_WIDTH },

  parentItem: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: 5,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },

  parentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },

  parentText: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },

  divider: { width: StyleSheet.hairlineWidth },

  // ── Right panel ──
  rightBox: { flex: 1 },

  // ── List header (chip bar) ──
  listHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.xs,
  },

  // ── Subcategory chip bar ──
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },

  // ── Product grid ──
  gridContent: { paddingBottom: Spacing["3xl"] },
  gridRow: { justifyContent: "flex-start" },
  cardWrapper: { marginBottom: CARD_GAP },

  // ── Skeleton ──
  skeletonGrid: { padding: CARD_H_PAD, gap: CARD_GAP },
  skeletonRow: { flexDirection: "row", gap: CARD_GAP },

  // ── Load more / end ──
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    paddingVertical: Spacing.sm,
    marginVertical: Spacing.md,
    borderRadius: 10,
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  endLine: { flex: 1, height: 1 },

  // ── Empty / Error ──
  emptyState: {
    alignItems: "center",
    paddingTop: Spacing["3xl"],
    paddingHorizontal: Spacing.lg,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: 8,
  },
});
