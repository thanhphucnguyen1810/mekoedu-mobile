import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTheme } from "../../src/theme";

export default function TabLayout() {
  const { c, typography } = useTheme();

  const tabs = [
    { name: "home",    label: "Trang chủ", icon: "home-outline",    activeIcon: "home" },
    { name: "courses", label: "Cửa hàng", icon: "storefront-outline", activeIcon: "storefront" },
    { name: "orders",  label: "Đơn hàng",  icon: "receipt-outline", activeIcon: "receipt" },
    { name: "profile", label: "Tài khoản", icon: "person-outline",  activeIcon: "person" },
  ];

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
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={(focused ? tab.activeIcon : tab.icon) as any}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
