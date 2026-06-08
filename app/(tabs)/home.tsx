import { AppHeader } from "@/src/components/common";
import {
  DYNAMIC_HOME_CONFIG,
  HomeComponentsMap,
} from "@/src/components/Home/HomeRegistry";
import { useTheme } from "@/src/theme";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export default function HomeScreen() {
  const { c } = useTheme();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sắp xếp các phân vùng hiển thị theo thứ tự "order" đã thiết lập
    const activeSections = (DYNAMIC_HOME_CONFIG?.sections ?? [])
      .filter((sec) => sec.visible)
      .sort((a, b) => a.order - b.order);

    setSections(activeSections);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: c.bg,
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader isSearchable showCart showNotification />
      <ScrollView showsVerticalScrollIndicator={false}>
        {sections.map((section) => {
          const ComponentToRender = HomeComponentsMap[section.type];

          if (!ComponentToRender) {
            return null;
          }

          return <ComponentToRender key={section.id} {...section.props} />;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
