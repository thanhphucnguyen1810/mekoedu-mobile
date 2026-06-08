// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import Toast from "react-native-toast-message";

import { store } from "../src/store";
import { ThemeProvider, useTheme } from "../src/theme";

const AppFrame = ({ children }: { children: React.ReactNode }) => {
  const { c, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View
        style={[
          styles.frame,
          {
            margin: spacing.md,
            overflow: "hidden",
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  )
}

const RootNavigation = () => {
  const { c } = useTheme();

  return (
    <AppFrame>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        {/* 1. Màn hình Splash Screen*/}
        <Stack.Screen name="index" options={{ headerShown: false }} />

        {/* 2. Màn hình giới thiệu Onboarding */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />

        {/* 3. Màn hình Chào mừng (Đăng nhập / Đăng ký) */}
        <Stack.Screen name="welcome" options={{ headerShown: false }} />

        {/* 4. Khai báo các nhóm luồng màn hình có sẵn */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AppFrame>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider initialConfig={{ mode: 'light' }}>
        <PaperProvider>
          <RootNavigation />
          <Toast /> 
        </PaperProvider>
      </ThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
  },
});
