// app/cart/payment.tsx
// ─────────────────────────────────────────────────────────────────────────────
// UI-only. Logic polling từ useCheckout.startPolling / stopPolling.
// ─────────────────────────────────────────────────────────────────────────────

import { AppText } from "@/src/components/common";
import { PaymentStatus } from "@/src/hooks/useCheckout";
import { fetchPlacedOrderStatus } from "@/src/services/liferay";
import { Colors, Spacing } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView, WebViewNavigation } from "react-native-webview";

const RED = Colors.primary[500];
const fmtVND = (n: number) => n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const POLL_MS  = 3000;
const MAX_POLL = 30;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const { orderId, paymentUrl, finalTotal, paymentMethod } = useLocalSearchParams<{
    orderId: string; paymentUrl: string; finalTotal: string; paymentMethod: string;
  }>();

  const total   = Number(finalTotal) || 0;
  const orderIdN = Number(orderId) || 0;
  const hasUrl  = !!paymentUrl;

  const [status,        setStatus]        = useState<PaymentStatus>(hasUrl ? "waiting" : "polling");
  const [webViewOpen,   setWebViewOpen]   = useState(hasUrl);
  const [wvLoading,     setWvLoading]     = useState(true);

  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  // ── Polling ────────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
  }, []);

  const startPolling = useCallback(() => {
    if (!orderIdN) return;
    pollCount.current = 0;
    setStatus("polling");

    pollTimer.current = setInterval(async () => {
      try {
        pollCount.current += 1;
        const s = await fetchPlacedOrderStatus(orderIdN);

        // paymentStatus === 3 (PAID) hoặc orderStatus === 4 (COMPLETED)
        if (s.paymentStatus === 3 || s.orderStatus === 4) {
          stopPolling(); setStatus("success"); return;
        }
        // CANCELLED
        if (s.orderStatus === 5) {
          stopPolling(); setStatus("failed"); return;
        }
        // Timeout
        if (pollCount.current >= MAX_POLL) {
          stopPolling(); setStatus("failed");
        }
      } catch {
        // giữ polling qua lỗi mạng tạm thời
      }
    }, POLL_MS);
  }, [orderIdN, stopPolling]);

  // ── Auto-start polling nếu không có paymentUrl (COD) ───────────────────────
  useEffect(() => {
    if (!hasUrl) startPolling();
    return stopPolling;
  }, []);

  // ── WebView navigation – bắt return URL / deep link ───────────────────────

  const handleNavChange = useCallback((nav: WebViewNavigation): boolean => {
    const url = nav.url ?? "";

    const isSuccess =
      url.includes("mekoedu://payment/success") ||
      url.includes("resultCode=0") ||        // MoMo success
      url.includes("vnp_ResponseCode=00");   // VNPay success

    const isFail =
      url.includes("mekoedu://payment/fail") ||
      url.includes("resultCode=49") ||       // MoMo cancel
      url.includes("vnp_ResponseCode=24");   // VNPay cancel

    if (isSuccess) { setWebViewOpen(false); startPolling(); return false; }
    if (isFail)    { setWebViewOpen(false); setStatus("failed"); return false; }
    return true;
  }, [startPolling]);

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const goHome   = useCallback(() => router.replace("/(tabs)/home" as any), []);
  const goOrders = useCallback(() => router.replace("/(tabs)/profile" as any), []);
  const retry    = useCallback(() => { setStatus("waiting"); setWebViewOpen(true); setWvLoading(true); }, []);

  // ─── RENDER: WebView ───────────────────────────────────────────────────────

  if (webViewOpen && paymentUrl) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* WebView header */}
        <View style={[wv.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Huỷ thanh toán?", "Đơn hàng chưa được thanh toán.", [
                { text: "Tiếp tục", style: "cancel" },
                { text: "Huỷ", style: "destructive", onPress: () => { setWebViewOpen(false); setStatus("failed"); } },
              ])
            }
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color={Colors.neutral[700]} />
          </TouchableOpacity>
          <AppText variant="body2" weight="600">{paymentMethod || "Thanh toán"}</AppText>
          <View style={{ width: 22 }} />
        </View>

        {wvLoading && (
          <View style={wv.loader}>
            <ActivityIndicator color={RED} />
            <AppText style={wv.loaderTxt}>Đang tải trang thanh toán...</AppText>
          </View>
        )}

        <WebView
          source={{ uri: paymentUrl }}
          style={{ flex: 1 }}
          onLoadStart={() => setWvLoading(true)}
          onLoadEnd={() => setWvLoading(false)}
          onShouldStartLoadWithRequest={handleNavChange}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
    );
  }

  // ─── RENDER: Polling / waiting ─────────────────────────────────────────────

  if (status === "polling" || status === "waiting") {
    return (
      <ResultLayout insets={insets.top}>
        <View style={[rs.icon, rs.iconNeutral]}>
          <ActivityIndicator size="large" color={RED} />
        </View>
        <AppText variant="body1" weight="600" style={rs.title}>Đang xử lý thanh toán</AppText>
        <AppText style={rs.sub}>Vui lòng chờ trong giây lát...</AppText>
        <AppText style={rs.sub}>Hệ thống đang xác nhận giao dịch.</AppText>
        <OrderCard orderId={orderId} method={paymentMethod} total={total} />
      </ResultLayout>
    );
  }

  // ─── RENDER: Success ───────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <ResultLayout insets={insets.top}>
        <View style={[rs.icon, rs.iconSuccess]}>
          <Ionicons name="checkmark" size={44} color="#fff" />
        </View>
        <AppText variant="h3" weight="700" style={[rs.title, { color: Colors.success }]}>
          Thanh toán thành công!
        </AppText>
        <AppText style={rs.sub}>Cảm ơn bạn đã mua hàng.</AppText>

        <OrderCard orderId={orderId} method={paymentMethod} total={total} />

        <View style={rs.moodleNote}>
          <Ionicons name="school-outline" size={14} color={Colors.brand[500]} />
          <AppText style={rs.moodleTxt}>Khoá học đang được kích hoạt tự động trong Moodle.</AppText>
        </View>

        <View style={[rs.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Btn label="Xem đơn hàng" onPress={goOrders} secondary />
          <Btn label="Về trang chủ" onPress={goHome} />
        </View>
      </ResultLayout>
    );
  }

  // ─── RENDER: Failed ────────────────────────────────────────────────────────

  return (
    <ResultLayout insets={insets.top}>
      <View style={[rs.icon, rs.iconFail]}>
        <Ionicons name="close" size={44} color="#fff" />
      </View>
      <AppText variant="h3" weight="700" style={[rs.title, { color: Colors.error }]}>
        Thanh toán thất bại
      </AppText>
      <AppText style={rs.sub}>Giao dịch không thành công hoặc đã bị huỷ.</AppText>

      <OrderCard orderId={orderId} method={paymentMethod} total={total} />

      <View style={[rs.actions, { paddingBottom: insets.bottom + 12 }]}>
        {hasUrl && <Btn label="Thử lại" onPress={retry} />}
        <Btn label="Về trang chủ" onPress={goHome} secondary />
      </View>
    </ResultLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ResultLayout({ insets, children }: { insets: number; children: React.ReactNode }) {
  return (
    <View style={[rs.root, { paddingTop: insets }]}>
      <View style={rs.body}>{children}</View>
    </View>
  );
}

function OrderCard({ orderId, method, total }: { orderId?: string; method?: string; total: number }) {
  return (
    <View style={rs.card}>
      <InfoRow label="Mã đơn hàng"    value={`#${orderId ?? "—"}`} />
      <InfoRow label="Phương thức"    value={method || "—"} />
      <View style={{ height: 0.5, backgroundColor: Colors.neutral[100], marginVertical: 4 }} />
      <InfoRow label="Tổng thanh toán" value={fmtVND(total)} highlight />
    </View>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 3 }}>
      <AppText style={{ fontSize: 12, color: Colors.neutral[400] }}>{label}</AppText>
      <AppText style={{ fontSize: highlight ? 15 : 13, fontWeight: highlight ? "700" : "500", color: highlight ? RED : Colors.neutral[800] }}>
        {value}
      </AppText>
    </View>
  );
}

function Btn({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <TouchableOpacity style={[rs.btn, secondary && rs.btnSec]} onPress={onPress} activeOpacity={0.85}>
      <AppText style={[rs.btnTxt, secondary && rs.btnTxtSec]}>{label}</AppText>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const wv = StyleSheet.create({
  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingBottom: 10, backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: Colors.neutral[100] },
  loader:    { position: "absolute", top: 80, left: 0, right: 0, alignItems: "center", gap: 8, zIndex: 10 },
  loaderTxt: { fontSize: 13, color: Colors.neutral[400] },
});

const rs = StyleSheet.create({
  root:      { flex: 1, backgroundColor: Colors.background.tertiary },
  body:      { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: Spacing.lg, gap: 8 },
  icon:      { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  iconNeutral:{ backgroundColor: Colors.neutral[200] },
  iconSuccess:{ backgroundColor: Colors.success },
  iconFail:  { backgroundColor: Colors.error },
  title:     { marginTop: 4, textAlign: "center" },
  sub:       { fontSize: 13, color: Colors.neutral[500], textAlign: "center" },
  card:      { width: "100%", backgroundColor: "#fff", borderRadius: Spacing.borderRadius.lg, padding: Spacing.md, marginTop: 16, gap: 4, borderWidth: 0.5, borderColor: Colors.neutral[100] },
  moodleNote:{ flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: Colors.brand[25], padding: 10, borderRadius: Spacing.borderRadius.md, marginTop: 8 },
  moodleTxt: { flex: 1, fontSize: 12, color: Colors.brand[700], lineHeight: 17 },
  actions:   { width: "100%", gap: 10, paddingTop: 12 },
  btn:       { backgroundColor: RED, paddingVertical: 13, borderRadius: Spacing.borderRadius.md, alignItems: "center" },
  btnTxt:    { color: "#fff", fontWeight: "700", fontSize: 15 },
  btnSec:    { backgroundColor: "#fff", borderWidth: 1, borderColor: Colors.neutral[200] },
  btnTxtSec: { color: Colors.neutral[700], fontWeight: "600", fontSize: 15 },
});
