// app/category/[id].tsx
import { AppHeader } from '@/src/components/common/AppHeader';
import { AppText } from '@/src/components/common/AppText';
import CourseCard from '@/src/components/CourseCard';
import { Skeleton } from '@/src/components/Skeleton';
import { getCategories, getProductsByCategory, getSubCategories } from '@/src/services/liferay';
import { Spacing, useTheme } from '@/src/theme';
import type { CatalogProduct, Category } from '@/src/types/liferay';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Đồng bộ padding với FeaturedCoursesList ────────────────────────────────
const ROOT_PADDING = 8; 
const AVAILABLE_WIDTH = SCREEN_WIDTH - (ROOT_PADDING * 2);
const VISUAL_PAD = Spacing.layout.screenHorizontal - ROOT_PADDING; // 16 - 8 = 8

const NUM_COLUMNS = 2;
const CARD_GAP = Spacing.layout.columnGap; // 12
const CARD_WIDTH = (AVAILABLE_WIDTH - VISUAL_PAD * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { key: 'popular', label: 'Phổ biến' },
  { key: 'newest', label: 'Mới nhất' },
  { key: 'price_asc', label: 'Giá thấp' },
  { key: 'price_desc', label: 'Giá cao' },
] as const;
type SortKey = (typeof SORT_OPTIONS)[number]['key'];

// ─── CategoryChip ─────────────────────────────────────────────────────────────
function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.93, useNativeDriver: true, tension: 200, friction: 10 }).start()}
      onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start()}
    >
      <Animated.View
        style={[
          styles.chip,
          {
            paddingHorizontal: Spacing.md - 2,
            paddingVertical: Spacing.xs + 1,
            borderRadius: 20,
            borderWidth: 1,
          },
          active
            ? { backgroundColor: c.primary, borderColor: c.primary }
            : { backgroundColor: c.bgSoft, borderColor: c.border },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <AppText
          variant="caption"
          style={[
            styles.chipText,
            active ? { color: c.bg, fontWeight: '600' } : { color: c.textSub, fontWeight: '500' },
          ]}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCats] = useState<Category[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);

  const [activeSubCat, setActiveSubCat] = useState<string>('all');
  const [activeSort, setActiveSort] = useState<SortKey>('popular');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const fetchingRef = useRef(false);
  const firstRender = useRef(true);
  pageRef.current = page;
  hasMoreRef.current = hasMore;

  // ── Fetch dữ liệu ───────────────────────────────────────────────────────────
  const loadCategoryInfo = useCallback(async () => {
    try {
      const cats = await getCategories();
      const found = cats.find((c) => String(c.id) === String(id)) ?? null;
      setCategory(found);

      if (id) {
        const subs = await getSubCategories(Number(id));
        setSubCats(subs ?? []);
      }
    } catch (e: any) {
      console.error('[CategoryScreen] loadCategoryInfo error:', e?.message);
    }
  }, [id]);

  const loadProducts = useCallback(async (
    pageNum: number,
    append: boolean,
    subCatId: string,
    sort: SortKey,
  ) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const filterSubId = subCatId !== 'all' ? Number(subCatId) : undefined;
      
      const result = await getProductsByCategory(Number(id), pageNum, PAGE_SIZE, filterSubId, sort);
      const items = result.items ?? [];
      const lastPage = result.lastPage ?? 1;
      const totalCnt = result.totalCount ?? 0;

      setProducts((prev) => append ? [...prev, ...items] : items);
      setPage(pageNum);
      setTotal(totalCnt);
      setHasMore(pageNum < lastPage);
      setError(null);
    } catch (e: any) {
      console.error('[CategoryScreen] loadProducts failed:', e?.message);
      setError(e?.message ?? 'Không thể tải dữ liệu sản phẩm');
    } finally {
      fetchingRef.current = false;
    }
  }, [id]);

  // ── Khởi chạy ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadCategoryInfo();
      await loadProducts(1, false, 'all', 'popular');
      setLoading(false);
    };
    init();
  }, [id]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setProducts([]);
    setPage(1);
    setHasMore(true);
    loadProducts(1, false, activeSubCat, activeSort);
  }, [activeSubCat, activeSort]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    await loadCategoryInfo();
    await loadProducts(1, false, activeSubCat, activeSort);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMoreRef.current || fetchingRef.current) return;
    loadProducts(pageRef.current + 1, true, activeSubCat, activeSort);
  };

  const handleSortToggle = () => {
    setShowSortMenu(!showSortMenu);
  };

  const handleSortSelect = (key: SortKey) => {
    setActiveSort(key);
    setShowSortMenu(false);
  };

  const handleCardPress = (item: CatalogProduct) =>
    router.push({
      pathname: '/course/[id]',
      params: { id: item.productId ?? item.id, source: 'liferay' },
    });

  // ── Render ──────────────────────────────────────────────────────────────────
  const activeSortLabel = SORT_OPTIONS.find((o) => o.key === activeSort)?.label ?? 'Sắp xếp';

  const renderSubCategoryBar = () => (
    <View style={{ backgroundColor: c.bg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterBar, { paddingHorizontal: VISUAL_PAD, gap: Spacing.sm }]}
      >
        <CategoryChip
          label="Tất cả"
          active={activeSubCat === 'all'}
          onPress={() => setActiveSubCat('all')}
        />
        {subCategories.map((sub) => (
          <CategoryChip
            key={String(sub.id)}
            label={sub.name}
            active={activeSubCat === String(sub.id)}
            onPress={() => setActiveSubCat(String(sub.id))}
          />
        ))}
      </ScrollView>
    </View>
  );

  const renderToolbar = () => (
    <View style={[styles.toolbar, { paddingHorizontal: VISUAL_PAD }]}>
      <AppText variant="caption" style={{ color: c.textSub }}>
        {total} kết quả
      </AppText>
      <TouchableOpacity
        style={[
          styles.sortBtn,
          {
            backgroundColor: showSortMenu ? c.primary : c.bgSoft,
            borderColor: showSortMenu ? c.primary : c.border,
          },
        ]}
        onPress={handleSortToggle}
      >
        <AppText style={{ color: showSortMenu ? '#FFF' : c.text, fontSize: 12 }}>
          {activeSortLabel}
        </AppText>
        <AppText style={{ color: showSortMenu ? '#FFF' : c.text }}>▾</AppText>
      </TouchableOpacity>
    </View>
  );

  const renderSkeleton = () => (
    <View style={styles.gridContent}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={[styles.row, { paddingHorizontal: VISUAL_PAD }]}>
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

  const ListHeader = (
    <View style={{ backgroundColor: c.bgSoft }}>
      {subCategories.length > 0 && renderSubCategoryBar()}
      {renderToolbar()}
    </View>
  );

  if (error && products.length === 0 && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
        <AppHeader title={category?.name ?? 'Danh mục'} showBack showCart />
        <View style={[styles.fullCenter, { backgroundColor: c.bgSoft }]}>
          <View style={[styles.errorCard, { backgroundColor: c.bg, borderColor: c.border }]}>
            <AppText style={styles.errorEmoji}>⚠️</AppText>
            <AppText variant="h4" style={[styles.errorTitle, { color: c.text }]}>Không thể tải dữ liệu</AppText>
            <AppText variant="body" style={[styles.errorDesc, { color: c.textSub }]}>{error}</AppText>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: c.primary }]}
              onPress={handleRefresh}
            >
              <AppText style={{ color: c.bg, fontSize: 14, fontWeight: '600' }}>Thử lại</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bgSoft }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <AppHeader
        title={category?.name ?? 'Danh mục'}
        showBack
        showCart
        showNotification
      />

      {loading && products.length === 0 ? (
        renderSkeleton()
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={[styles.row, { paddingHorizontal: VISUAL_PAD }]}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            !loading ? (
              <View style={[styles.emptyState, { paddingVertical: Spacing['3xl'] }]}>
                <View style={[styles.emptyIconWrap, { backgroundColor: c.bgSoft }]}>
                  <AppText style={styles.emptyEmoji}>🔎</AppText>
                </View>
                <AppText variant="h4" style={[styles.emptyTitle, { color: c.text }]}>
                  Không có khóa học nào
                </AppText>
                <AppText variant="body" style={[{ color: c.textSub, textAlign: 'center' }]}>
                  Chưa có khóa học trong danh mục này
                </AppText>
              </View>
            ) : null
          }
          ListFooterComponent={
            hasMore && products.length > 0 ? (
              <TouchableOpacity
                style={[styles.loadMoreBtn, { borderColor: c.primary, backgroundColor: c.primary + '10' }]}
                onPress={handleLoadMore}
                disabled={fetchingRef.current}
              >
                {fetchingRef.current ? (
                  <ActivityIndicator size="small" color={c.primary} />
                ) : (
                  <>
                    <AppText variant="bodySmall" style={{ color: c.primary, fontWeight: '600' }}>Xem thêm</AppText>
                    <AppText style={{ color: c.primary }}>↓</AppText>
                  </>
                )}
              </TouchableOpacity>
            ) : products.length > 0 ? (
              <View style={[styles.endRow, { paddingVertical: Spacing.lg }]}>
                <View style={[styles.endLine, { backgroundColor: c.border }]} />
                <AppText variant="caption" style={{ color: c.textSub }}>Đã hiển thị tất cả</AppText>
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
      )}

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={StyleSheet.absoluteFillObject}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleSortToggle} />
          <View style={[styles.sortMenu, { backgroundColor: c.bg, borderColor: c.border }]}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortMenuItem, { borderBottomColor: c.border }]}
                onPress={() => handleSortSelect(opt.key)}
              >
                <AppText style={activeSort === opt.key ? { color: c.primary, fontWeight: 'bold' } : { color: c.text }}>
                  {opt.label}
                </AppText>
                {activeSort === opt.key && (
                  <Ionicons name="checkmark" size={16} color={c.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  filterBar: { paddingVertical: Spacing.sm },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    backgroundColor: 'transparent',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    gap: 3,
    minWidth: 88,
  },
  gridContent: { paddingBottom: Spacing['3xl'] },
  row: { justifyContent: 'flex-start' },
  cardWrapper: { marginBottom: CARD_GAP },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: 12 },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingVertical: Spacing.sm + 3,
    marginHorizontal: VISUAL_PAD,
    marginVertical: Spacing.md,
    gap: Spacing.xs,
    borderRadius: 12,
  },
  endRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: VISUAL_PAD },
  endLine: { flex: 1, height: 1 },
  emptyState: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { marginBottom: Spacing.sm, textAlign: 'center' },
  errorCard: { width: '100%', alignItems: 'center', borderRadius: 16, padding: Spacing.xl, borderWidth: 1 },
  errorEmoji: { fontSize: 44, marginBottom: Spacing.md },
  errorTitle: { marginBottom: Spacing.sm, textAlign: 'center' },
  errorDesc: { textAlign: 'center', lineHeight: 22, marginBottom: Spacing.lg },
  retryBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm + 2, borderRadius: 8 },
  sortMenu: {
    position: 'absolute',
    top: 110,
    right: VISUAL_PAD,
    minWidth: 140,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  sortMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
