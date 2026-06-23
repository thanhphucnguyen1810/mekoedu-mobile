import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { AppConfig } from "@/src/config/appConfig";
import { useTheme } from "../../src/theme";

export default function TabLayout() {
  const { c, typography } = useTheme();
  const tabs = AppConfig.tabs;

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
          title: tabs.home.label,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name={tabs.home.icon as any}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 2: Cửa hàng */}
      <Tabs.Screen
        name="courses"
        options={{
          title: tabs.courses.label,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name={tabs.courses.icon as any}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Tab 3: Đơn hàng */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="clipboard-list-outline" // 👈 icon outline, đồng bộ với các tab khác
              size={24}                     // 👈 size 24 như các tab khác
              color={color}                 // 👈 màu lấy từ theme (active/inactive tự động)
            />
          ),
        }}
      />

      {/* Tab 4: Tài khoản */}
      <Tabs.Screen
        name="profile"
        options={{
          title: tabs.profile.label,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name={tabs.profile.icon as any}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
