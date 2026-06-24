import CourseCard from "@/src/components/CourseCard";
import { AppConfig } from "@/src/config/appConfig";
import { getCategories, getProducts } from "@/src/services/liferay";
import { Spacing, useTheme } from "@/src/theme";
import type { CatalogProduct, Category } from "@/src/types/liferay";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { AppText } from "../common/AppText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROOT_PADDING = 8; 

const AVAILABLE_WIDTH = SCREEN_WIDTH - (ROOT_PADDING * 2);

const VISUAL_PAD = Spacing.layout.screenHorizontal - ROOT_PADDING; // 16 - 8 = 8

const CARD_GAP = Spacing.layout.columnGap;        // 12
const NUM_COLUMNS = 2;

const CARD_WIDTH =
  (AVAILABLE_WIDTH - VISUAL_PAD * 2 - CARD_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

interface CategoryProducts {
  category: Category;
  products: CatalogProduct[];
}

interface FeaturedCoursesListProps {
  title?: string;
  limit?: number;
}

export const FeaturedCoursesList = ({
  title,
  limit = 6,
}: FeaturedCoursesListProps) => {
  const router = useRouter();
  const { c, spacing } = useTheme();

  const [featuredProducts, setFeaturedProducts] = useState<CatalogProduct[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<CategoryProducts[]>([]);
  const [loading, setLoading] = useState(true);

  const config = AppConfig.home.featuredCourses;
  const finalTitle = title || config.defaultTitle;

  useEffect(() => { loadHomeProducts(); }, []);

  const loadHomeProducts = async () => {
    try {
      setLoading(true);
      const featuredResponse = await getProducts({ pageSize: limit, page: 1 });
      setFeaturedProducts(featuredResponse.items ?? []);

      const categories = await getCategories();
      const results = await Promise.all(
        (categories ?? []).map(async (category: Category) => {
          const response = await getProducts({
            pageSize: 5,
            categoryId: Number(category.id),
            page: 1,
          });
          return { category, products: response.items ?? [] };
        })
      );
      setCategoryProducts(results.filter((item) => item.products.length > 0));
    } catch (error) {
      console.error("Lỗi load home products:", error);
      setFeaturedProducts([]);
      setCategoryProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const goToProductDetail = (item: CatalogProduct) => {
    router.push(`/course/${item.productId}`);
  };
  
  const goToCategory = (category: Category) => {
  router.push({
    pathname: "/category/[id]",
    params: { id: String(category.id) }
  });
};

  const renderHeader = (headerTitle: string, onViewAll?: () => void) => (
    <View style={styles.header}>
      <AppText style={[styles.title, { color: c.text }]}>{headerTitle}</AppText>
      {onViewAll && (
        <Pressable style={styles.viewAllBtn} onPress={onViewAll}>
          <AppText style={[styles.viewAllText, { color: c.primary }]}>
            {config.viewAllLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={c.primary} />
        </Pressable>
      )}
    </View>
  );

  const renderProductList = (products: CatalogProduct[]) => (
    <FlatList
      data={products}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
      renderItem={({ item }) => (
        <View style={{ width: CARD_WIDTH }}>
          <CourseCard course={item} onPress={() => goToProductDetail(item)} />
        </View>
      )}
    />
  );

  if (loading) {
    return (
      <View style={[styles.loadingBox, { paddingVertical: Spacing[4] }]}>
        <ActivityIndicator size="small" color={c.primary} />
      </View>
    );
  }

  return (
    <View>
      {featuredProducts.length > 0 && (
        <View style={styles.section}>
          {renderHeader(finalTitle)}
          {renderProductList(featuredProducts)}
        </View>
      )}

      {categoryProducts.map((item) => (
        <View key={item.category.id} style={styles.section}>
          {renderHeader(item.category.name, () => goToCategory(item.category))}
          {renderProductList(item.products)}
        </View>
      ))}
    </View>
  );
};

export default FeaturedCoursesList;

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing.layout.sectionGap,
  },
  header: {
    paddingHorizontal: VISUAL_PAD,
    marginBottom: Spacing[2],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: Spacing[2],
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: VISUAL_PAD,
    paddingBottom: Spacing[2],
  },
});
