// app/(tabs)/categories.tsx  (hoặc categories screen của bạn)
import { AppHeader } from "@/src/components/common";
import { AppText } from "@/src/components/common/AppText";
import CourseCard from "@/src/components/CourseCard";
import { Skeleton } from "@/src/components/Skeleton";
import {
  getCategories,
  getProductsByCategory,
  getSubCategories,
} from "@/src/services/catalogService";
import { selectCartCount } from "@/src/store/slices/cartSlice";
import { useTheme } from "@/src/theme";
import { CatalogProduct, Category } from "@/src/types/liferay";
import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { router, useLocalSearchParams, useRouter } from "expo-router";
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
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Layout constants ─────────────────────────────────────────────────────────
const SIDEBAR_COLLAPSED = 60;   // thu nhỏ
const SIDEBAR_EXPANDED  = 180;  // mở rộng khi chọn
const SIDEBAR_W = SIDEBAR_COLLAPSED; // mặc định dùng collapsed
const RIGHT_W  = SCREEN_WIDTH - SIDEBAR_W;
const NUM_COLS = 2;
const H_PAD    = 8;
const CARD_GAP = 8;
const CARD_W   = (RIGHT_W - H_PAD * 2 - CARD_GAP) / NUM_COLS;
const PAGE_SIZE = 12;

// ─── ParentItem ───────────────────────────────────────────────────────────────
function ParentItem({ cat, active, onPress }: { cat: Category; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const press = () =>
    Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, tension: 300, friction: 12 }).start();
  const release = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }).start();

  const initial = (cat.name?.[0] ?? "?").toUpperCase();

  return (
    <Pressable onPress={onPress} onPressIn={press} onPressOut={release}>
      <Animated.View
        style={[
          styles.parentItem,
          {
            backgroundColor: active ? c.primary + "14" : "transparent",
            borderRightWidth: active ? 2.5 : 0,
            borderRightColor: c.primary,
          },
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Icon / ảnh danh mục */}
        <View style={[
          styles.parentIcon,
          { backgroundColor: active ? c.primary : c.bgSoft, borderColor: active ? c.primary : c.border }
        ]}>
          {cat.imageUrl ? (
            <Image
              source={{ uri: cat.imageUrl }}
              style={{ width: 28, height: 28, borderRadius: 6 }}
              resizeMode="cover"
            />
          ) : (
            <Text style={{ fontSize: 14, fontWeight: "800", color: active ? "#fff" : c.primary }}>
              {initial}
            </Text>
          )}
        </View>

        {/* Tên — wrap 2 dòng */}
        <AppText
          numberOfLines={2}
          style={[
            styles.parentLabel,
            { color: active ? c.primary : c.textSub, fontWeight: active ? "700" : "400" },
          ]}
        >
          {cat.name}
        </AppText>

        {/* Active indicator dot */}
        {active && (
          <View style={[styles.activeDot, { backgroundColor: c.primary }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── SubChip ──────────────────────────────────────────────────────────────────
function SubChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress}>
      <View style={[
        styles.subChip,
        active
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { backgroundColor: "transparent", borderColor: c.border },
      ]}>
        <AppText style={[styles.subChipText, { color: active ? "#fff" : c.textSub }]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CategoriesScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const cartCount = useSelector(selectCartCount);
  const { selectedId } = useLocalSearchParams<{ selectedId?: string }>();

  const [parentCats, setParentCats] = useState<Category[]>([]);
  const [childCats, setChildCats]   = useState<Category[]>([]);
  const [selParent, setSelParent]   = useState<number | null>(null);
  const [selSub, setSelSub]         = useState<string>("all");
  const [products, setProducts]     = useState<CatalogProduct[]>([]);
  const [loadingParent, setLoadingParent] = useState(true);
  const [loadingChild, setLoadingChild]   = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore]       = useState(true);
  const [page, setPage]             = useState(1);
  const [searchText, setSearchText] = useState("");

  const fetchingRef = useRef(false);
  const pageRef     = useRef(1);
  const hasMoreRef  = useRef(true);
  pageRef.current   = page;
  hasMoreRef.current = hasMore;

  // ── Load parents ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const parents = await getCategories();
        setParentCats(parents);
        if (parents.length > 0) {
          const targetId = selectedId
            ? parents.find(p => String(p.id) === String(selectedId))?.id ?? parents[0].id
            : parents[0].id;
          setSelParent(targetId);
          loadChildren(targetId);
        }
      } catch (e) {
        console.warn("getCategories failed", e);
      } finally {
        setLoadingParent(false);
      }
    })();
  }, []);

  const loadChildren = async (parentId: number) => {
    setLoadingChild(true);
    try {
      const subs = await getSubCategories(parentId);
      setChildCats(subs);
    } catch (e) {
      setChildCats([]);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleParentPress = (id: number) => {
    if (id === selParent) return;
    setSelParent(id);
    setSelSub("all");
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setSearchText("");
    loadChildren(id);
  };

  // ── Load products ───────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (
    parentId: number, pageNum: number, append: boolean, subCat: string,
  ) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (!append) setLoadingProducts(true);
    try {
      const subId = subCat !== "all" ? Number(subCat) : undefined;
      const result = await getProductsByCategory(parentId, pageNum, PAGE_SIZE, subId);
      const items = result.items ?? [];
      const lastPage = result.lastPage ?? 1;
      setProducts(prev => append ? [...prev, ...items] : items);
      setPage(pageNum);
      setHasMore(pageNum < lastPage);
    } catch (e: any) {
      console.warn("getProductsByCategory failed:", e?.message);
    } finally {
      fetchingRef.current = false;
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (selParent == null) return;
    setProducts([]);
    setPage(1);
    setHasMore(true);
    loadProducts(selParent, 1, false, selSub);
  }, [selParent, selSub]);

  const handleRefresh = async () => {
    if (selParent == null) return;
    setRefreshing(true);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    await loadChildren(selParent);
    await loadProducts(selParent, 1, false, selSub);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!hasMoreRef.current || fetchingRef.current || selParent == null) return;
    loadProducts(selParent, pageRef.current + 1, true, selSub);
  };

  // ── Filtered products (local search) ────────────────────────────────────────
  const filtered = searchText.trim()
    ? products.filter(p => p.name?.toLowerCase().includes(searchText.toLowerCase()))
    : products;

  // ── Renders ─────────────────────────────────────────────────────────────────
  const renderCard = ({ item, index }: { item: CatalogProduct; index: number }) => (
    <View style={[styles.cardWrap, { width: CARD_W }, index % 2 === 1 && { marginLeft: CARD_GAP }]}>
      <CourseCard
        course={item}
        onPress={() => router.push({ pathname: "/course/[id]", params: { id: item.productId ?? item.id, source: "liferay" } })}
      />
    </View>
  );

  const ListHeader = (
    <View>
      {/* Sub-category chips */}
      {childCats.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subChipList}
        >
          <SubChip label="Tất cả" active={selSub === "all"} onPress={() => setSelSub("all")} />
          {childCats.map(sub => (
            <SubChip
              key={String(sub.id)}
              label={sub.name}
              active={selSub === String(sub.id)}
              onPress={() => setSelSub(String(sub.id))}
            />
          ))}
        </ScrollView>
      )}
      {/* Result count */}
      <View style={[styles.countBar, { borderBottomColor: c.border }]}>
        <AppText style={[styles.countText, { color: c.textSub }]}>
          {filtered.length} khóa học
        </AppText>
      </View>
    </View>
  );

  const Skeleton2 = () => (
    <View style={styles.skeletonRow}>
      <Skeleton height={190} width={CARD_W} style={{ borderRadius: 10 }} />
      <Skeleton height={190} width={CARD_W} style={{ borderRadius: 10, marginLeft: CARD_GAP }} />
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* ── Top bar ── */}
      <AppHeader
        isSearchable
        placeholder="Tìm trong danh mục..."
        searchQuery={searchText}
        onSearchChange={setSearchText}
        showCart
      />

      {/* ── Body: sidebar + content ── */}
      <View style={styles.body}>
        {/* ── Left sidebar: danh mục cha ── */}
        <View style={[styles.sidebar, { borderRightColor: c.border, backgroundColor: c.bgSoft }]}>
          {loadingParent ? (
            <View style={styles.sideCenter}>
              <ActivityIndicator size="small" color={c.primary} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {parentCats.map(cat => (
                <ParentItem
                  key={cat.id}
                  cat={cat}
                  active={cat.id === selParent}
                  onPress={() => handleParentPress(cat.id)}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Right: sub-chips + products ── */}
        <View style={styles.right}>
          {loadingProducts && products.length === 0 ? (
            <View style={styles.skeletonWrap}>
              <Skeleton2 />
              <Skeleton2 />
              <Skeleton2 />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item, i) => `${item.productId ?? item.id}-${i}`}
              numColumns={NUM_COLS}
              contentContainerStyle={styles.gridContent}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={renderCard}
              ListHeaderComponent={ListHeader}
              ListEmptyComponent={
                !loadingProducts ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={36} color={c.border} />
                    <AppText style={[styles.emptyText, { color: c.textSub }]}>
                      {searchText ? "Không tìm thấy khóa học" : "Chưa có khóa học"}
                    </AppText>
                  </View>
                ) : null
              }
              ListFooterComponent={
                hasMore && filtered.length > 0 ? (
                  <TouchableOpacity
                    style={[styles.loadMoreBtn, { borderColor: c.border }]}
                    onPress={handleLoadMore}
                    disabled={fetchingRef.current}
                  >
                    {fetchingRef.current
                      ? <ActivityIndicator size="small" color={c.primary} />
                      : <><AppText style={[styles.loadMoreText, { color: c.primary }]}>Xem thêm</AppText>
                          <Ionicons name="chevron-down" size={14} color={c.primary} /></>
                    }
                  </TouchableOpacity>
                ) : filtered.length > 0 ? (
                  <View style={[styles.endRow, { borderTopColor: c.border }]}>
                    <AppText style={[styles.endText, { color: c.textSub }]}>Đã hiển thị tất cả</AppText>
                  </View>
                ) : null
              }
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={c.primary} colors={[c.primary]} />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.4}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
      {/* ── Bottom Tab Bar ── */}
      <BottomTabBar insets={insets} />
    </View>
  );
}

function BottomTabBar({ insets }: { insets: any }) {
  const { c } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const TAB_HEIGHT = 60;

  const tabs = [
    { label: "Trang chủ", icon: "home-outline", activeIcon: "home", route: "/(tabs)/home" },
    { label: "Cửa hàng", icon: "storefront-outline", activeIcon: "storefront", route: "/(tabs)/courses" },
    { label: "Đơn hàng", icon: "receipt-outline", activeIcon: "receipt", route: "/(tabs)/orders" },
    { label: "Tài khoản", icon: "person-outline", activeIcon: "person", route: "/(tabs)/profile" },
  ];

  // Hàm kiểm tra tab có đang active không
  const isActive = (route: string) => {
    return pathname === route;
  };

  return (
    <View style={{
      position: "absolute", 
      bottom: 0, 
      left: 0, 
      right: 0,
      height: TAB_HEIGHT + insets.bottom,
      backgroundColor: c.bg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      flexDirection: "row",
      paddingBottom: insets.bottom,
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.route}
            style={{ 
              flex: 1, 
              alignItems: "center", 
              justifyContent: "center", 
              gap: 3 
            }}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(active ? tab.activeIcon : tab.icon) as any}
              size={22}
              color={active ? c.primary : c.textSub}
            />
            <AppText 
              style={{ 
                fontSize: 10, 
                color: active ? c.primary : c.textSub, 
                fontWeight: active ? "600" : "400" 
              }}
            >
              {tab.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },

  // Sidebar
  sidebar: {
    width: SIDEBAR_W,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sideCenter: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ParentItem
  parentItem: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
    position: "relative",
  },
  parentIcon: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  parentLabel: {
    fontSize: 9.5,
    textAlign: "center",
    lineHeight: 13,
  },
  activeDot: {
    position: "absolute",
    right: 2, top: "50%",
    width: 4, height: 4, borderRadius: 2,
    transform: [{ translateY: -2 }],
  },

  // Right panel
  right: { flex: 1 },

  // Sub chips
  subChipList: { paddingHorizontal: H_PAD, paddingVertical: 9, gap: 6 },
  subChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  subChipText: { fontSize: 11.5, fontWeight: "500" },

  // Count bar
  countBar: {
    paddingHorizontal: H_PAD,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    marginBottom: 6,
  },
  countText: { fontSize: 11 },

  // Grid
  gridContent: { paddingBottom: 40 },
  columnWrapper: { paddingHorizontal: H_PAD, marginBottom: CARD_GAP },
  cardWrap: {},

  // Skeleton
  skeletonWrap: { padding: H_PAD, gap: CARD_GAP },
  skeletonRow: { flexDirection: "row", gap: CARD_GAP, marginBottom: CARD_GAP },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 50, gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center" },

  // Footer
  loadMoreBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, borderWidth: 1, borderRadius: 10,
    paddingVertical: 9,
    marginHorizontal: H_PAD,
    marginVertical: 12,
  },
  loadMoreText: { fontSize: 12.5, fontWeight: "600" },
  endRow: {
    alignItems: "center", paddingVertical: 16,
    borderTopWidth: 0.5,
    marginHorizontal: H_PAD, marginTop: 8,
  },
  endText: { fontSize: 11 },
});

