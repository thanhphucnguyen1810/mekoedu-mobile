import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useTheme } from "../../src/theme";

export default function TabLayout() {
  const { c, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Ẩn header trên cùng
        tabBarActiveTintColor: c.primary, // Khi bấm vào tab thì icon đổi sang Đỏ
        tabBarInactiveTintColor: c.textSub, // Tab không chọn thì màu xám
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
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
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
          title: 'Khóa học',
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
          title: 'Thi',
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
          title: 'Tài khoản',
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
