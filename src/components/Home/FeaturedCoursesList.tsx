// src/components/Home/FeaturedCoursesList.tsx
//
// ⚠️  QUAN TRỌNG – Import CourseCard TRỰC TIẾP từ file, KHÔNG qua common/index.ts
//     Lý do: common/index.ts → AppFilterBar → HomeRegistry → FeaturedCoursesList → CourseCard
//     Vòng lặp đó khiến CourseCard = undefined lúc render → crash "Element type is invalid"
//
import CourseCard from '@/src/components/CourseCard'; // ✅ default import trực tiếp
import type { LiferayCatalogProduct } from '@/src/services/liferayService';
import { getProducts } from '@/src/services/liferayService';
import { useTheme } from '@/src/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { AppText } from '../common/AppText';

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
      const response = await getProducts({ pageSize: limit, categoryId, page: 1 });
      setCourses(response.items);
    } catch (error) {
      console.error('Lỗi load featured courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppText style={styles.sectionTitle}>{title}</AppText>
        <View style={{ padding: spacing[4], alignItems: 'center' }}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      </View>
    );
  }

  if (courses.length === 0) return null;

  return (
    <View style={styles.container}>
      <AppText style={styles.sectionTitle}>{title}</AppText>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <CourseCard
              course={item}
              onPress={() => router.push(`/course/${item.id}`)}
            />
          </View>
        )}
      />
    </View>
  );
};

export default FeaturedCoursesList;

const styles = StyleSheet.create({
  container:    { marginVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginBottom: 8 },
  listContent:  { paddingHorizontal: 16, gap: 12 },
  cardWrapper:  { width: 250 },
});
