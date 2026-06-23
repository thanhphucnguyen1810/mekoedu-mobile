import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrdersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>📦 Đơn hàng của bạn</Text>
      <Text style={styles.subtitle}>Chưa có đơn hàng nào</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { marginTop: 10, color: "#888" },
});
