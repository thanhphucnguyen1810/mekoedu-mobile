// app/(tabs)/courses.tsx
import { AppHeader } from "@/src/components/common/AppHeader";
import { AppText } from "@/src/components/common/AppText";
import CourseCard from "@/src/components/CourseCard";
import { useLiferayCategories, useLiferayProducts } from "@/src/hooks/useLiferayCatalog";
import type { LiferayCatalogProduct } from "@/src/services/liferayService";
import { Spacing, useTheme } from "@/src/theme";
import { Typography } from "@/src/theme/Typography";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getNumColumns = () => {
  if (SCREEN_WIDTH >= 1024) return 3;
  if (SCREEN_WIDTH >= 768) return 2;
  return 1;
};

const NUM_COLUMNS = getNumColumns();
const HORIZONTAL_PADDING = Spacing.layout.screenHorizontal;
const CARD_GAP = Spacing.layout.columnGap;
const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

export default function CatalogScreen() {
  const { c, spacing, radius, typography } = useTheme();
  const [searchText, setSearchText] = useState("");
  const [activeCatId, setActiveCatId] = useState<number | undefined>(undefined);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const { products, loading, error, hasMore, loadMore, applyFilters, refetch } =
    useLiferayProducts({ pageSize: NUM_COLUMNS === 1 ? 8 : 12 });

  const { categories } = useLiferayCategories();

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

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
    [activeCatId, applyFilters]
  );

  const handleCategory = useCallback(
    (catId: number | undefined) => {
      setActiveCatId(catId);
      applyFilters({ search: searchText, categoryId: catId });
    },
    [searchText, applyFilters]
  );

  const handleCardPress = (item: LiferayCatalogProduct) =>
    router.push({ pathname: "/course/[id]", params: { id: item.id, source: "liferay" } });

  const searchBorderColor = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [c.border, c.primary],
  });

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
      <View style={[styles.heroSection, { paddingHorizontal: HORIZONTAL_PADDING }]}>
        <AppText variant="overline" style={[styles.heroLabel, { color: c.primary }]}>
          Khám phá
        </AppText>
        <AppText variant="h2" style={[styles.heroTitle, { color: c.text }]}>
          Khóa học dành cho bạn
        </AppText>
      </View>

      <Animated.View
        style={[
          styles.searchWrapper,
          {
            backgroundColor: c.bgSoft,
            marginHorizontal: HORIZONTAL_PADDING,
            borderRadius: radius.xl,
            borderColor: searchBorderColor,
          },
        ]}
      >
        <AppText style={[styles.searchIcon, { color: c.textSub }]}>🔍</AppText>
        <TextInput
          style={[styles.searchInput, { color: c.text, ...typography.variants.body }]}
          value={searchText}
          onChangeText={handleSearch}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder="Tìm tên khóa học..."
          placeholderTextColor={c.textSub}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearBtn}>
            <AppText style={[styles.clearIcon, { color: c.textSub }]}>✕</AppText>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.catRow, { paddingHorizontal: HORIZONTAL_PADDING, gap: spacing.sm }]}
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

      <View style={[styles.countRow, { paddingHorizontal: HORIZONTAL_PADDING }]}>
        <AppText variant="caption" style={{ color: c.textSub }}>
          {loading && products.length === 0 ? "Đang tải..." : `${products.length} khóa học`}
        </AppText>
      </View>
    </View>
  );

  const renderItem = ({ item, index }: { item: LiferayCatalogProduct; index: number }) => {
    const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
    return (
      <View
        style={[
          styles.cardWrapper,
          { width: CARD_WIDTH, marginBottom: spacing.layout.gridGap },
          !isLastInRow && { marginRight: CARD_GAP },
        ]}
      >
        <CourseCard course={item} onPress={() => handleCardPress(item)} />
      </View>
    );
  };

  if (error && products.length === 0) {
    return (
      <View style={[styles.emptyState, { backgroundColor: c.bg }]}>
        <AppText style={styles.emptyStateEmoji}>⚠️</AppText>
        <AppText variant="h4" style={[styles.emptyStateTitle, { color: c.text }]}>
          Không thể tải dữ liệu
        </AppText>
        <AppText variant="body" style={[styles.emptyStateDesc, { color: c.textSub }]}>
          {error}
        </AppText>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: c.primary, borderRadius: radius.md }]}
          onPress={refetch}
        >
          <AppText style={[styles.retryButtonText, { color: c.bg }]}>Thử lại</AppText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bgSoft }]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.bg} />
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            backgroundColor: c.bg,
            borderBottomColor: c.border,
            opacity: headerOpacity,
          },
        ]}
      >
        <AppHeader title="Khám phá" showBack={false} />
      </Animated.View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        numColumns={NUM_COLUMNS}
        key={`grid-${NUM_COLUMNS}`}
        contentContainerStyle={[styles.gridContent, { paddingHorizontal: HORIZONTAL_PADDING }]}
        columnWrapperStyle={NUM_COLUMNS > 1 ? styles.columnWrapper : undefined}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          !loading ? (
            <View style={[styles.emptyState, { paddingVertical: spacing["3xl"] }]}>
              <AppText style={styles.emptyStateEmoji}>🔎</AppText>
              <AppText variant="h4" style={[styles.emptyStateTitle, { color: c.text }]}>
                Không tìm thấy kết quả
              </AppText>
              <AppText variant="body" style={[styles.emptyStateDesc, { color: c.textSub }]}>
                Thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác
              </AppText>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && products.length === 0 ? (
            <View style={[styles.loadingContainer, { gap: spacing.sm, paddingVertical: spacing.xl }]}>
              <ActivityIndicator size="large" color={c.primary} />
              <AppText variant="caption" style={{ color: c.textSub }}>
                Đang tải khóa học...
              </AppText>
            </View>
          ) : hasMore ? (
            <TouchableOpacity
              style={[
                styles.loadMoreButton,
                {
                  marginHorizontal: HORIZONTAL_PADDING,
                  marginVertical: spacing.md,
                  borderRadius: radius.lg,
                  borderColor: c.primary,
                  backgroundColor: c.primary + "10",
                },
              ]}
              onPress={loadMore}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <AppText variant="bodySmall" style={[styles.loadMoreText, { color: c.primary }]}>
                  Xem thêm khóa học
                </AppText>
              )}
            </TouchableOpacity>
          ) : products.length > 0 ? (
            <View style={[styles.endRow, { gap: spacing.sm, paddingVertical: spacing.lg }]}>
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
            refreshing={loading && products.length > 0}
            onRefresh={refetch}
            tintColor={c.primary}
            colors={[c.primary]}
          />
        }
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        initialNumToRender={NUM_COLUMNS * 3}
        maxToRenderPerBatch={NUM_COLUMNS * 2}
        windowSize={5}
        scrollEventThrottle={16}
      />
    </View>
  );
}

// Category Chip Component với design system
function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { c, radius, spacing, typography } = useTheme();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.chip,
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm - 2,
          borderRadius: radius.full,
          borderWidth: spacing.borderWidth.thin,
        },
        active
          ? { backgroundColor: c.primary, borderColor: c.primary + "80" }
          : { backgroundColor: c.bgSoft, borderColor: c.border },
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
    >
      <AppText
        variant="caption"
        style={[
          styles.chipText,
          active ? { color: c.bg, fontWeight: "600" } : { color: c.textSub, fontWeight: "500" },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 0.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    paddingBottom: Spacing.md,
    borderBottomWidth: Spacing.borderWidth.thin,
  },
  heroSection: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  heroLabel: {
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    lineHeight: 40,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderWidth: Spacing.borderWidth.normal,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 16,
  },
  clearBtn: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  clearIcon: {
    fontSize: 12,
    fontWeight: "700",
  },
  catRow: {
    paddingBottom: Spacing.sm,
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
  },
  chipPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  chipText: {
    textAlign: "center",
  },
  countRow: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  gridContent: {
    paddingBottom: Spacing["3xl"],
  },
  columnWrapper: {
    gap: 0,
  },
  cardWrapper: {},
  loadingContainer: {
    alignItems: "center",
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: Spacing.borderWidth.normal,
    paddingVertical: Spacing.md,
  },
  loadMoreText: {
    fontWeight: "600",
  },
  endRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  endLine: {
    flex: 1,
    height: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyStateDesc: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
  },
  retryButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
  },
});
