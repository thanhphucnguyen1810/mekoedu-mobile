// app/(tabs)/courses.tsx
import { CourseCard } from "@/src/components/CourseCard";
import {
  useLiferayCategories,
  useLiferayProducts,
} from "@/src/hooks/useLiferayCatalog";
import type { LiferayCatalogProduct } from "@/src/services/liferayService";
import { Colors, Spacing } from "@/src/theme";
import { Typography } from "@/src/theme/Typography";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getNumColumns = () => {
  if (SCREEN_WIDTH >= 768) return 3;
  if (SCREEN_WIDTH >= 480) return 2;
  return 1;
};

const NUM_COLUMNS = getNumColumns();
const CARD_GAP = Spacing.layout.columnGap;
const HORIZONTAL_PADDING = Spacing.layout.screenHorizontal;
const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

export default function CatalogScreen() {
  const [searchText, setSearchText] = useState("");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const searchAnim = useRef(new Animated.Value(0)).current;

  const { products, loading, error, hasMore, loadMore, applyFilters, refetch } =
    useLiferayProducts({ pageSize: NUM_COLUMNS === 1 ? 8 : 12 });

  const { categories } = useLiferayCategories();

  const handleSearchFocus = () =>
    Animated.spring(searchAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 80,
      friction: 8,
    }).start();

  const handleSearchBlur = () =>
    Animated.spring(searchAnim, {
      toValue: 0,
      useNativeDriver: false,
      tension: 80,
      friction: 8,
    }).start();

  const handleSearch = useCallback(
    (text: string) => {
      setSearchText(text);
      applyFilters({ search: text, categoryId: activeCatId });
    },
    [activeCatId, applyFilters],
  );

  const handleCategory = useCallback(
    (catId: number | undefined) => {
      setActiveCatId(catId);
      applyFilters({ search: searchText, categoryId: catId });
    },
    [searchText, applyFilters],
  );

  const handleCardPress = (item: LiferayCatalogProduct) =>
    router.push({
      pathname: "/course/[id]",
      params: { id: item.productId ?? "s", source: "liferay" },
    });

  const searchBorderColor = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.neutral[200], Colors.primary[400]],
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.heroSection}>
        <Text style={styles.heroLabel}>Khám phá</Text>
        <Text style={styles.heroTitle}>Khóa học{"\n"}dành cho bạn</Text>
      </View>

      <Animated.View
        style={[styles.searchWrapper, { borderColor: searchBorderColor }]}
      >
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={handleSearch}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder="Tìm tên khóa học..."
          placeholderTextColor={Colors.neutral[400]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearch("")}
            style={styles.clearBtn}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catRow}
      >
        <CategoryChip
          label="Tất cả"
          active={activeCatId === undefined}
          onPress={() => handleCategory(undefined)}
        />
        {categories.map((c) => (
          <CategoryChip
            key={c.id}
            label={c.name}
            active={activeCatId === c.id}
            onPress={() => handleCategory(c.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {loading && products.length === 0
            ? "Đang tải..."
            : `${products.length} khóa học`}
        </Text>
      </View>
    </View>
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: LiferayCatalogProduct;
    index: number;
  }) => {
    const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
    return (
      <View
        style={[
          styles.cardWrapper,
          { width: CARD_WIDTH },
          !isLastInRow && { marginRight: CARD_GAP },
        ]}
      >
        {/* onPress → detail. addToCart + navigate /cart xử lý trong CourseCard */}
        <CourseCard
          course={item}
          onPress={() => router.push(`/course/${item.productId!}`)}
        />
      </View>
    );
  };

  if (error && products.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateEmoji}>⚠️</Text>
        <Text style={styles.emptyStateTitle}>Không thể tải dữ liệu</Text>
        <Text style={styles.emptyStateDesc}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.background.primary}
      />
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={NUM_COLUMNS}
        key={`grid-${NUM_COLUMNS}`}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={NUM_COLUMNS > 1 ? styles.columnWrapper : undefined}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>🔎</Text>
              <Text style={styles.emptyStateTitle}>Không tìm thấy kết quả</Text>
              <Text style={styles.emptyStateDesc}>
                Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && products.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
              <Text style={styles.loadingText}>Đang tải khóa học...</Text>
            </View>
          ) : hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMore}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              ) : (
                <Text style={styles.loadMoreText}>Xem thêm khóa học</Text>
              )}
            </TouchableOpacity>
          ) : products.length > 0 ? (
            <View style={styles.endRow}>
              <View style={styles.endLine} />
              <Text style={styles.endText}>Đã hiển thị tất cả</Text>
              <View style={styles.endLine} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={loading && products.length > 0}
            onRefresh={refetch}
            tintColor={Colors.primary[500]}
            colors={[Colors.primary[500]]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        initialNumToRender={NUM_COLUMNS * 3}
        maxToRenderPerBatch={NUM_COLUMNS * 2}
        windowSize={5}
      />
    </View>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.secondary },
  header: {
    backgroundColor: Colors.background.primary,
    paddingBottom: Spacing.md,
    borderBottomWidth: Spacing.borderWidth.thin,
    borderBottomColor: Colors.neutral[100],
    marginBottom: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: Colors.neutral[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  heroSection: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  heroLabel: {
    ...Typography.variants.overline,
    color: Colors.primary[500],
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontSize: Typography.sizes["2xl"],
    fontWeight: "700",
    color: Colors.neutral[900],
    lineHeight: 32,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.neutral[50],
    marginHorizontal: HORIZONTAL_PADDING,
    marginBottom: Spacing.md,
    borderRadius: Spacing.borderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderWidth: Spacing.borderWidth.normal,
  },
  searchIcon: { fontSize: 15, marginRight: Spacing.sm, opacity: 0.6 },
  searchInput: {
    flex: 1,
    ...Typography.variants.body1,
    color: Colors.neutral[900],
    padding: 0,
  },
  clearBtn: { padding: 4, marginLeft: Spacing.sm },
  clearIcon: { fontSize: 12, color: Colors.neutral[400], fontWeight: "700" },
  catRow: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 4,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Spacing.borderRadius.full,
    backgroundColor: Colors.neutral[100],
    borderWidth: Spacing.borderWidth.thin,
    borderColor: Colors.neutral[200],
  },
  chipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[600],
  },
  chipPressed: { opacity: 0.75 },
  chipText: {
    ...Typography.variants.caption,
    fontWeight: "600",
    color: Colors.neutral[600],
  },
  chipTextActive: { color: Colors.neutral[0] },
  countRow: { paddingHorizontal: HORIZONTAL_PADDING, paddingTop: Spacing.sm },
  countText: { ...Typography.variants.caption, color: Colors.neutral[500] },
  gridContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: Spacing["3xl"],
  },
  columnWrapper: { marginBottom: Spacing.layout.gridGap },
  cardWrapper: { marginBottom: NUM_COLUMNS === 1 ? Spacing.layout.gridGap : 0 },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: { ...Typography.variants.caption, color: Colors.neutral[400] },
  loadMoreButton: {
    marginHorizontal: HORIZONTAL_PADDING,
    marginVertical: Spacing.md,
    paddingVertical: Spacing.md - 2,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: Spacing.borderWidth.normal,
    borderColor: Colors.primary[400],
    alignItems: "center",
    backgroundColor: Colors.primary[25],
  },
  loadMoreText: {
    ...Typography.variants.body2,
    fontWeight: "600",
    color: Colors.primary[600],
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  endLine: { flex: 1, height: 1, backgroundColor: Colors.neutral[200] },
  endText: { ...Typography.variants.caption, color: Colors.neutral[400] },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["3xl"],
  },
  emptyStateEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyStateTitle: {
    ...Typography.variants.h4,
    color: Colors.neutral[700],
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateDesc: {
    ...Typography.variants.body2,
    color: Colors.neutral[500],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Spacing.borderRadius.lg,
  },
  retryButtonText: {
    ...Typography.variants.button,
    color: Colors.neutral[0],
    fontSize: Typography.sizes.sm,
  },
});
