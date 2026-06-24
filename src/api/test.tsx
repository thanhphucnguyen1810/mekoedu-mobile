// app/(tabs)/_layout.tsx
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function TabLayout() {
  const { c, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const TAB_CONTENT_HEIGHT = 64;
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom;

  // Radius lớn hơn nửa chiều rộng màn hình → tạo vòng cong elip thoải
  const CURVE_RADIUS = SCREEN_WIDTH * 0.6;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#fff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
        tabBarStyle: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,

          backgroundColor: c.primary,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.18,
          shadowRadius: 16,

          height: tabBarHeight,
          paddingBottom: insets.bottom,
          paddingTop: 10,

          borderTopLeftRadius: CURVE_RADIUS,
          borderTopRightRadius: CURVE_RADIUS,
          overflow: "hidden",
        },
        tabBarLabelStyle: {
          ...typography.variants.caption,
          fontWeight: "600",
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Trang chủ",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "home" : "home-outline"}
              size={26}
              color={focused ? "#fff" : "rgba(255,255,255,0.55)"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: "Cửa hàng",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "storefront" : "storefront-outline"}
              size={26}
              color={focused ? "#fff" : "rgba(255,255,255,0.55)"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Đơn hàng",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "clipboard-list" : "clipboard-list-outline"}
              size={26}
              color={focused ? "#fff" : "rgba(255,255,255,0.55)"}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Tài khoản",
          tabBarIcon: ({ focused }) => (
            <MaterialCommunityIcons
              name={focused ? "account" : "account-outline"}
              size={26}
              color={focused ? "#fff" : "rgba(255,255,255,0.55)"}
            />
          ),
        }}
      />
    </Tabs>
  );
}

