import { Stack } from "expo-router";

import { useTheme } from "../../src/theme";

export default function AuthLayout() {
  const { c } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ẩn header mặc định để dùng AppHeader tự code
        contentStyle: { backgroundColor: c.bg }, // Set màu nền trắng
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
