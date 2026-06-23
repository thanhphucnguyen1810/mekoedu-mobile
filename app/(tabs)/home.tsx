import { AppHeader } from "@/src/components/common";
import { DYNAMIC_HOME_CONFIG, HomeComponentsMap } from "@/src/components/Home/HomeRegistry";
import { Spacing, useTheme } from "@/src/theme";
import { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Chiều cao tab bar = 60 (icon + label) + insets.bottom (safe area)
  // Con số 60 phải khớp với TAB_ICON_AREA trong file _layout.tsx
  const TAB_BAR_HEIGHT = 60 + insets.bottom;

  useEffect(() => {
    const activeSections = DYNAMIC_HOME_CONFIG.sections
      .filter((sec) => sec.visible)
      .sort((a, b) => a.order - b.order);
    setSections(activeSections);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.bg }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader isSearchable showCart />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + Spacing.layout.screenVertical }
        ]}
      >
        {sections.map((section) => {
          const ComponentToRender = HomeComponentsMap[section.type];
          if (!ComponentToRender) return null;
          return <ComponentToRender key={section.id} {...section.props} />;
        })}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: Spacing.layout.screenVertical,
  },
});
