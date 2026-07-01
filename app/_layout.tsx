// app/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";

import FlyToCartOverlay from "@/src/components/FlyToCartOverlay";
import { store } from "../src/store";
import { ThemeProvider, useTheme } from "../src/theme";
import { StatusBar } from "expo-status-bar";
import { MEKO_RED } from "@/src/components/cart/cartConstants";

const ROOT_PADDING = 8;

const RootNavigation = () => {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <StatusBar style="light" backgroundColor={MEKO_RED} />
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <View
          style={[
            styles.layoutWrapper,
            {
              paddingTop: insets.top > 0 ? ROOT_PADDING : 0,
              paddingBottom: insets.bottom > 0 ? ROOT_PADDING : 0,
              paddingLeft: ROOT_PADDING,
              paddingRight: ROOT_PADDING,
            },
          ]}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: c.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
    </>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <ThemeProvider initialConfig={{ mode: 'light' }}>
        <PaperProvider>
          <RootNavigation />
          <Toast />
          <FlyToCartOverlay />
        </PaperProvider>
      </ThemeProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  layoutWrapper: {
    flex: 1,
  },
});
