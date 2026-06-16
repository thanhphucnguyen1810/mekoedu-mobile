// src/components/FeaturedCoursesList/index.tsx
import ProductCard from "@/src/components/ProductCard";
import categoriesService from "@/src/services/categoriesService";
import productService, { IProduct } from "@/src/services/productService";
import { useTheme } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { CategoryItem } from "../CategoryGrid";
import { AppText } from "../common/AppText";

interface CategoryProducts {
  category: CategoryItem;
  products: IProduct[];
}

interface FeaturedCoursesListProps {
  title?: string;
  limit?: number;
}

export const FeaturedCoursesList = ({
  title = "Sản phẩm nổi bật",
  limit = 6,
}: FeaturedCoursesListProps) => {
  const router = useRouter();
  const { c, spacing } = useTheme();

  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<CategoryProducts[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeProducts();
  }, []);

  const loadHomeProducts = async () => {
    try {
      setLoading(true);

      const featured = await productService.getProducts(1, limit);
      setFeaturedProducts(featured ?? []);

      const categories = await categoriesService.getCategories();

      const results = await Promise.all(
        (categories ?? []).map(async (category: CategoryItem) => {
          const products = await productService.getProducts(1, 5, {
            categoryId: category.id,
          });

          return {
            category,
            products: products ?? [],
          };
        }),
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

  const goToProductDetail = (item: IProduct) => {
    router.push(`/course/${item.productId ?? item.id}`);
  };

  const goToCategory = (category: CategoryItem) => {
    router.push({
      pathname: "/courses",
      params: {
        id: String(category.id),
        name: category.name,
      },
    });
  };
  const renderHeader = (headerTitle: string, onViewAll?: () => void) => (
    <View style={styles.header}>
      <AppText style={[styles.title, { color: c.text }]}>{headerTitle}</AppText>

      {onViewAll && (
        <Pressable style={styles.viewAllBtn} onPress={onViewAll}>
          <AppText style={[styles.viewAllText, { color: c.primary }]}>
            Xem tất cả
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={c.primary} />
        </Pressable>
      )}
    </View>
  );

  const renderProductList = (products: IProduct[]) => (
    <FlatList
      data={products}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => (
        <View style={styles.cardWrapper}>
          <ProductCard item={item} onPress={() => goToProductDetail(item)} />
        </View>
      )}
    />
  );

  if (loading) {
    return (
      <View style={[styles.loadingBox, { paddingVertical: spacing[4] }]}>
        <ActivityIndicator size="small" color={c.primary} />
      </View>
    );
  }

  return (
    <View>
      {featuredProducts.length > 0 && (
        <View style={styles.section}>
          {renderHeader(title)}
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

const styles = StyleSheet.create({
  section: {
    marginTop: 14,
  },

  header: {
    paddingHorizontal: 12,
    marginBottom: 10,
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
    paddingLeft: 10,
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
    paddingHorizontal: 12,
    paddingBottom: 6,
    gap: 10,
  },

  cardWrapper: {
    width: 155,
  },
});
