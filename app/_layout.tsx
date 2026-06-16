// app/_layout.tsx

import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";

import { store } from "../src/store";
import { ThemeProvider, useTheme } from "../src/theme";

export type ToastType = "success" | "error" | "info";

import storeConfigService from "@/src/services/storeConfigService";
import { useEffect } from "react";
import { BaseToast } from "react-native-toast-message";
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        backgroundColor: "rgba(34, 197, 94, 0.15)",
        borderLeftWidth: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(34, 197, 94, 0.6)",
      }}
      text1Style={{
        color: "#22c55e",
        fontSize: 14,
        fontWeight: "700",
      }}
    />
  ),

  error: (props: any) => (
    <BaseToast
      {...props}
      style={{
        backgroundColor: "rgba(239, 68, 68, 0.15)",
        borderLeftWidth: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(239, 68, 68, 0.6)",
      }}
      text1Style={{
        color: "#ef4444",
        fontSize: 14,
        fontWeight: "700",
      }}
    />
  ),

  info: (props: any) => (
    <BaseToast
      {...props}
      style={{
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        borderLeftWidth: 0,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(59, 130, 246, 0.6)",
      }}
      text1Style={{
        color: "#3b82f6",
        fontSize: 14,
        fontWeight: "700",
      }}
    />
  ),
};
export const showToast = (type: ToastType, message: string) => {
  Toast.show({
    type,
    text1: message,
  });
};

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
  useEffect(() => {
    const initConfig = async () => {
      try {
        const config = await storeConfigService.getStoreConfig();
        console.log("[App] Config loaded:", config);
      } catch (error) {
        console.error("[App] Config error:", error);
      }
    };

    initConfig();
  }, []);
  return (
    <Provider store={store}>
      <ThemeProvider initialConfig={{ mode: "light" }}>
        <PaperProvider>
          <RootNavigation />
          <Toast
            config={toastConfig}
            position="top"
            topOffset={60}
            visibilityTime={3000}
          />
        </PaperProvider>
      </ThemeProvider>
    </Provider>
  );
}
