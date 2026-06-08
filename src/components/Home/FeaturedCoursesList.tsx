// src/components/FeaturedCoursesList/index.tsx
import ProductCard from "@/src/components/ProductCard";
import productService, { IProduct } from "@/src/services/productService";
import { useTheme } from "@/src/theme";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { AppText } from "../common/AppText";

interface FeaturedCoursesListProps {
  title: string;
  categoryId?: number;
  limit?: number;
}

export const FeaturedCoursesList = ({
  title,
  categoryId,
  limit = 6,
}: FeaturedCoursesListProps) => {
  const router = useRouter();
  const { c, spacing } = useTheme();

  const [courses, setCourses] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCourses();
  }, [categoryId]);

  const loadFeaturedCourses = async () => {
    try {
      setLoading(true);

      const products = await productService.getProducts(1, limit, {
        categoryId,
      });

      setCourses(products);
    } catch (error) {
      console.error("Lỗi load featured courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText style={[styles.title, { color: c.text }]}>{title}</AppText>
      </View>

      {loading ? (
        <View style={[styles.loadingBox, { paddingVertical: spacing[4] }]}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      ) : courses.length === 0 ? null : (
        <FlatList
          data={courses}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                item={item}
                onPress={() =>
                  router.push(`/course/${item.productId ?? item.id}`)
                }
              />
            </View>
          )}
        />
      )}
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
  },

  title: {
    fontSize: 17,
    fontWeight: "800",
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
