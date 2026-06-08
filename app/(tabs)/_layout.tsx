import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTheme } from "../../src/theme";

export default function TabLayout() {
  const { c, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSub,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopWidth: 1,
          borderTopColor: c.border,
        },
        tabBarLabelStyle: {
          ...typography.variants.caption,
        },
      }}
    >
      {/* Tab 1: Trang chủ */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="course"
        options={{
          title: "Khóa học",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="book-open-variant"
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3: Thi */}
      <Tabs.Screen
        name="exams"
        options={{
          title: "Thi",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 4: Tài khoản */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
