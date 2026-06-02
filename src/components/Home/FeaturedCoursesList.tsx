// src/components/FeaturedCoursesList/index.tsx
import type { LiferayCatalogProduct } from "@/src/services/liferayService";
import { getProducts } from "@/src/services/liferayService";
import { useTheme } from "@/src/theme";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";
import { AppText } from "../common/AppText";
import { CourseCard } from "../CourseCard";

interface FeaturedCoursesListProps {
  title: string;
  categoryId?: number;
  limit?: number;
}

export const FeaturedCoursesList = ({
  title,
  categoryId,
  limit = 5,
}: FeaturedCoursesListProps) => {
  const router = useRouter();
  const { c, spacing } = useTheme();
  const [courses, setCourses] = useState<LiferayCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCourses();
  }, [categoryId]);

  const loadFeaturedCourses = async () => {
    setLoading(true);
    try {
      const response = await getProducts({
        pageSize: limit,
        categoryId,
        page: 1,
      });
      setCourses(response.items);
    } catch (error) {
      console.error("Lỗi load featured courses:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppText style={styles.title}>{title}</AppText>
        <View style={{ padding: spacing[4], alignItems: "center" }}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      </View>
    );
  }

  if (courses.length === 0) return null;

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            {/* addToCart + navigate /cart hoặc /cart/checkout đã xử lý trong CourseCard */}
            <CourseCard
              course={item}
              onPress={() => router.push(`/course/${item.productId!}`)}
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: { paddingHorizontal: 16, gap: 12 },
  cardWrapper: { width: 250 },
});
