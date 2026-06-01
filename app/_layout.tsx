// app/_layout.tsx

import { Stack } from "expo-router";
import React from "react";
import { PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";

import { store } from "../src/store";
import { ThemeProvider, useTheme } from "../src/theme";

const RootNavigation = () => {
  const { c } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      {/* 1. Màn hình khởi chạy đầu tiên (Splash Screen) */}
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* 2. Màn hình trượt giới thiệu Onboarding */}
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />

      {/* 3. Màn hình Chào mừng (Đăng nhập / Đăng ký) */}
      <Stack.Screen name="welcome" options={{ headerShown: false }} />

      {/* 4. Khai báo các nhóm luồng màn hình có sẵn của bạn */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider initialConfig={{ mode: 'light' }}>
        <PaperProvider>
          <RootNavigation />
        </PaperProvider>
      </ThemeProvider>
    </Provider>
  );
}
