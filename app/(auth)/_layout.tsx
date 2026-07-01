import { Stack } from "expo-router";
import { useTheme } from "../../src/theme";
import { StatusBar } from "react-native";
import { MEKO_RED } from "@/src/components/cart/cartConstants";


export default function AuthLayout() {
  const { c } = useTheme();

  return (
    <>
      <StatusBar style="light" backgroundColor={MEKO_RED} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
