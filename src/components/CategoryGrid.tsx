import { useTheme } from "@/src/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import categoriesService from "../services/categoriesService";
import { AppText } from "./common/AppText";

interface CategoryItem {
  id: number;
  name: string;
}

const CategoryGrid = () => {
  const router = useRouter();
  const { c, spacing } = useTheme();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesService.getCategories();

        if (response.length > 0) {
          setCategories(response);
        }
      } catch (error) {
        console.warn("Failed to load categories", error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryPress = (category: CategoryItem) => {
    // router.push({
    //   pathname: "/category/[id]",
    //   params: {
    //     id: String(category.id),
    //     name: category.name,
    //   },
    // });
  };

  const handleCategoriesPress = () => {
    router.push("/categories");
  };

  return (
    <View
      style={{
        backgroundColor: c.bg,
        marginHorizontal: spacing.sm,
      }}
    >
      {loading && categories.length === 0 ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      ) : (
        <View style={styles.wrapper}>
          <Pressable
            onPress={handleCategoriesPress}
            style={({ pressed }) => [
              styles.tileWrapper,
              {
                opacity: pressed ? 0.85 : 1,
                marginRight: spacing.sm,
              },
            ]}
          >
            <View
              style={[
                styles.tile,
                {
                  backgroundColor: c.bgSoft,
                  borderColor: c.border,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={28}
                color={c.text}
              />
            </View>

            <AppText
              style={[
                styles.tileLabel,
                {
                  color: c.text,
                },
              ]}
              numberOfLines={1}
            >
              Danh mục
            </AppText>
          </Pressable>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.row,
              {
                gap: spacing.sm,
              },
            ]}
          >
            {categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category)}
                style={({ pressed }) => [
                  styles.tileWrapper,
                  {
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.tile,
                    {
                      backgroundColor: c.bgSoft,
                      borderColor: c.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="apps"
                    size={28}
                    color={c.text}
                  />
                </View>

                <AppText
                  style={[
                    styles.tileLabel,
                    {
                      color: c.text,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {category.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingWrapper: {
    paddingVertical: 24,
    alignItems: "center",
  },

  wrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  row: {
    paddingVertical: 6,
    alignItems: "center",
  },

  tileWrapper: {
    width: 64,
    alignItems: "center",
  },

  tile: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tileLabel: {
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },
});

export default CategoryGrid;
