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

export interface CategoryItem {
  id: number;
  name: string;
}

const getCategoryInitial = (name?: string) => {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
};

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

  const goToCategory = (category: CategoryItem) => {
    router.push({
      pathname: "/courses",
      params: {
        id: String(category.id),
        name: category.name,
      },
    });
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
                styles.allTile,
                {
                  backgroundColor: c.primary,
                  borderColor: c.primary,
                },
              ]}
            >
              <MaterialCommunityIcons name="apps" size={30} color="#FFFFFF" />
            </View>

            <AppText
              style={[
                styles.tileLabel,
                {
                  color: c.primary,
                  fontWeight: "700",
                },
              ]}
              numberOfLines={1}
            >
              Tất cả
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
                onPress={() => goToCategory(category)}
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
                  <AppText
                    style={[
                      styles.initialText,
                      {
                        color: c.primary,
                      },
                    ]}
                  >
                    {getCategoryInitial(category.name)}
                  </AppText>
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
    width: 66,
    alignItems: "center",
  },

  allTile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  tile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  initialText: {
    fontSize: 24,
    fontWeight: "800",
  },

  tileLabel: {
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },
});

export default CategoryGrid;
