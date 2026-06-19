import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTheme } from "../../src/theme";
import { AppConfig } from "@/src/config/appConfig";

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

      {/* Tab 2: Khóa học */}
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

      {/* Tab 3: Thi */}
      <Tabs.Screen
        name="exams"
        options={{
          title: tabs.exams.label,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name={tabs.exams.icon as any}
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
