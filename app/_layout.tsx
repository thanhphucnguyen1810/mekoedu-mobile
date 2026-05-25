import { Stack } from "expo-router";
import React from "react";
import { PaperProvider } from "react-native-paper";
import { Provider } from "react-redux";

import { store } from "../src/store";
import { ThemeProvider, useTheme } from "../src/theme";

const RootNavigation = () => {
  const { c } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    >
      {/* Khai báo các nhóm luồng màn hình */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      {/* // Bọc theme */}
      <ThemeProvider initialConfig={{ mode: 'light' }}>
        {/* Bọc Provider của React Native Paper (để Dialog, Loader, UI kit hoạt động) */}
        <PaperProvider>
          <RootNavigation />
        </PaperProvider>
      </ThemeProvider>
    </Provider>
  )
}
