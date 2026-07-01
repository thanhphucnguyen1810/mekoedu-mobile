// app/cart/checkout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// UI-only. Mọi API call & state đều từ useCheckout hook.
// ─────────────────────────────────────────────────────────────────────────────

import { AppText } from "@/src/components/common";
import { useCheckout, CheckoutStep } from "@/src/hooks/useCheckout";
import { CheckoutResult, ShippingMethod, PaymentMethod } from "@/src/services/liferay";
import { Colors, Spacing } from "@/src/theme";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RED = Colors.primary[500];
const fmtVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { cartId: cartIdParam, finalTotal } = useLocalSearchParams<{
    cartId: string; finalTotal: string;
  }>();

  const cartId = cartIdParam ? Number(cartIdParam) : null;
  const total  = Number(finalTotal) || 0;

  const onPlaceOrderSuccess = useCallback((result: CheckoutResult) => {
    router.replace({
      pathname: "/cart/payment",
      params: {
        orderId:       String(result.orderId),
        paymentUrl:    result.paymentUrl ?? "",
        finalTotal:    finalTotal ?? "0",
        cartId:        cartIdParam ?? "",
      },
    });
  }, [finalTotal, cartIdParam]);

  const co = useCheckout(
    cartId,
    total,
    onPlaceOrderSuccess,
    () => router.back(),
  );

  const nextDisabled =
    (co.step === "shipping" && !co.selectedShipping) ||
    (co.step === "payment"  && !co.selectedPayment);

  return (
    <View style={[s.root, { backgroundColor: Colors.background.tertiary }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={HIT}>
          <Ionicons name="close" size={22} color={Colors.neutral[700]} />
        </TouchableOpacity>
        <AppText variant="body1" weight="600" style={s.headerTitle}>Thanh toán</AppText>
        <View style={{ width: 22 }} />
      </View>

      {/* Step bar */}
      <View style={s.stepWrap}>
        <StepBar current={co.step} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ── STEP 1: Address ── */}
          {co.step === "address" && (
            <>
              <SectionCard title="Người nhận" icon="person-outline">
                <Field label="Họ và tên" value={co.address.name}
                  onChangeText={v => co.setAddress({ ...co.address, name: v })}
                  placeholder="Nguyễn Văn A" required />
                <Field label="Số điện thoại" value={co.address.phone}
                  onChangeText={v => co.setAddress({ ...co.address, phone: v })}
                  placeholder="0901 234 567" keyboardType="phone-pad" required />
              </SectionCard>

              <SectionCard title="Địa chỉ nhận hàng" icon="location-outline">
                <Field label="Số nhà, tên đường" value={co.address.street}
                  onChangeText={v => co.setAddress({ ...co.address, street: v })}
                  placeholder="123 Nguyễn Huệ" required />
                <Field label="Phường / Xã" value={co.address.ward}
                  onChangeText={v => co.setAddress({ ...co.address, ward: v })}
                  placeholder="Phường Bến Nghé" />
                <Field label="Quận / Huyện" value={co.address.district}
                  onChangeText={v => co.setAddress({ ...co.address, district: v })}
                  placeholder="Quận 1" />
                <Field label="Tỉnh / Thành phố" value={co.address.city}
                  onChangeText={v => co.setAddress({ ...co.address, city: v })}
                  placeholder="Hồ Chí Minh" />
              </SectionCard>

              <InfoNote text="Địa chỉ này cũng được dùng làm địa chỉ thanh toán." />
            </>
          )}

          {/* ── STEP 2: Shipping ── */}
          {co.step === "shipping" && (
            <SectionCard title="Phương thức vận chuyển" icon="car-outline">
              {co.loading
                ? <CenteredSpinner />
                : co.shippingMethods.length === 0
                  ? <EmptyHint text="Không có phương thức vận chuyển nào." />
                  : co.shippingMethods.map(m => (
                    <OptionRow
                      key={m.key}
                      selected={co.selectedShipping?.id === m.id}
                      onPress={() => co.setSelectedShipping(m)}
                      title={m.name}
                      subtitle={m.description}
                      right={
                        m.amount > 0
                          ? <AppText style={s.shippingAmt}>{fmtVND(m.amount)}</AppText>
                          : <AppText style={s.shippingFree}>Miễn phí</AppText>
                      }
                    />
                  ))
              }
            </SectionCard>
          )}

          {/* ── STEP 3: Payment ── */}
          {co.step === "payment" && (
            <SectionCard title="Phương thức thanh toán" icon="card-outline">
              {co.loading
                ? <CenteredSpinner />
                : co.paymentMethods.length === 0
                  ? <EmptyHint text="Không có phương thức thanh toán nào." />
                  : co.paymentMethods.map(m => (
                    <OptionRow
                      key={m.key}
                      selected={co.selectedPayment?.key === m.key}
                      onPress={() => co.setSelectedPayment(m)}
                      title={m.name}
                      subtitle={m.description}
                      right={<PaymentIcon name={m.name} />}
                    />
                  ))
              }
              <InfoNote text="Thanh toán bảo mật bởi Liferay Commerce. Thông tin thẻ không được lưu lại." />
            </SectionCard>
          )}

          {/* ── STEP 4: Confirm ── */}
          {co.step === "confirm" && (
            <>
              <SectionCard title="Địa chỉ nhận hàng" icon="location-outline">
                <AppText variant="body2" weight="600">{co.address.name}</AppText>
                <AppText style={s.sub}>{co.address.phone}</AppText>
                <AppText style={s.sub}>
                  {[co.address.street, co.address.ward, co.address.district, co.address.city].filter(Boolean).join(", ")}
                </AppText>
              </SectionCard>

              <SectionCard title="Vận chuyển" icon="car-outline">
                <AppText variant="body2" weight="600">{co.selectedShipping?.name}</AppText>
                <AppText style={s.sub}>
                  {co.shippingFee > 0 ? fmtVND(co.shippingFee) : "Miễn phí"}
                </AppText>
              </SectionCard>

              <SectionCard title="Thanh toán" icon="card-outline">
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <PaymentIcon name={co.selectedPayment?.name ?? ""} />
                  <AppText variant="body2" weight="600">{co.selectedPayment?.name}</AppText>
                </View>
              </SectionCard>

              <SectionCard title="Tóm tắt" icon="receipt-outline">
                <SummaryRow label="Tạm tính" value={fmtVND(total)} />
                <SummaryRow label="Phí vận chuyển" value={co.shippingFee > 0 ? fmtVND(co.shippingFee) : "Miễn phí"} />
                <View style={s.divider} />
                <SummaryRow label="Tổng thanh toán" value={fmtVND(total + co.shippingFee)} highlight />
              </SectionCard>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action bar */}
      <ActionBar
        onBack={co.handleBack}
        onNext={co.handleNext}
        nextLabel={co.step === "confirm" ? "Đặt hàng" : "Tiếp tục"}
        loading={co.loading}
        nextDisabled={nextDisabled}
        insetBottom={insets.bottom}
      />
    </View>
  );
}

// ─── Atom components ──────────────────────────────────────────────────────────

const HIT = { top: 10, bottom: 10, left: 10, right: 10 };

function StepBar({ current }: { current: CheckoutStep }) {
  const steps: { key: CheckoutStep; label: string }[] = [
    { key: "address",  label: "Địa chỉ" },
    { key: "shipping", label: "Vận chuyển" },
    { key: "payment",  label: "Thanh toán" },
    { key: "confirm",  label: "Xác nhận" },
  ];
  const idx = steps.findIndex(s => s.key === current);
  return (
    <View style={sb.wrap}>
      {steps.map((s, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <React.Fragment key={s.key}>
            <View style={sb.item}>
              <View style={[sb.dot, done && sb.done, active && sb.active]}>
                {done
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <AppText style={[sb.num, active && sb.numActive]}>{i + 1}</AppText>}
              </View>
              <AppText style={[sb.label, active && sb.labelActive, done && sb.labelDone]}>
                {s.label}
              </AppText>
            </View>
            {i < steps.length - 1 && <View style={[sb.line, done && sb.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={sc.card}>
      <View style={sc.hdr}>
        <Ionicons name={icon as any} size={15} color={RED} />
        <AppText variant="body2" weight="600" style={{ color: Colors.neutral[800] }}>{title}</AppText>
      </View>
      {children}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, required }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; keyboardType?: any; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fi.wrap}>
      <AppText style={fi.label}>
        {label}{required && <AppText style={{ color: RED }}> *</AppText>}
      </AppText>
      <TextInput
        style={[fi.input, focused && fi.focused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.neutral[400]}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function OptionRow({ selected, onPress, title, subtitle, right }: {
  selected: boolean; onPress: () => void;
  title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={[or.row, selected && or.sel]} onPress={onPress} activeOpacity={0.75}>
      <View style={[or.radio, selected && or.radioSel]}>
        {selected && <View style={or.dot} />}
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body2" weight={selected ? "600" : "400"}
          style={{ color: selected ? Colors.neutral[900] : Colors.neutral[700] }}>
          {title}
        </AppText>
        {subtitle ? <AppText style={or.sub}>{subtitle}</AppText> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
      <AppText style={{ fontSize: 13, color: highlight ? Colors.neutral[800] : Colors.neutral[500], fontWeight: highlight ? "600" : "400" }}>
        {label}
      </AppText>
      <AppText style={{ fontSize: highlight ? 17 : 13, fontWeight: highlight ? "700" : "400", color: highlight ? RED : Colors.neutral[700] }}>
        {value}
      </AppText>
    </View>
  );
}

function ActionBar({ onBack, onNext, nextLabel, loading, nextDisabled, insetBottom }: {
  onBack: () => void; onNext: () => void; nextLabel: string;
  loading?: boolean; nextDisabled?: boolean; insetBottom: number;
}) {
  return (
    <View style={[ab.wrap, { paddingBottom: insetBottom + 8, borderTopColor: Colors.neutral[100] }]}>
      <TouchableOpacity style={ab.back} onPress={onBack}>
        <Ionicons name="arrow-back" size={15} color={Colors.neutral[600]} />
        <AppText style={ab.backTxt}>Quay lại</AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[ab.next, (nextDisabled || loading) && ab.nextDim]}
        onPress={onNext}
        disabled={nextDisabled || loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <AppText variant="body2" weight="700" style={{ color: "#fff" }}>{nextLabel}</AppText>}
      </TouchableOpacity>
    </View>
  );
}

function PaymentIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes("momo"))  return <View style={[pi.badge, { backgroundColor: "#ae2070" }]}><AppText style={pi.txt}>M</AppText></View>;
  if (n.includes("vnpay")) return <View style={[pi.badge, { backgroundColor: "#005BAA" }]}><AppText style={[pi.txt, { fontSize: 10 }]}>VP</AppText></View>;
  if (n.includes("cod") || n.includes("nhận hàng")) return <Ionicons name="cash-outline" size={20} color={Colors.success} />;
  return <Ionicons name="card-outline" size={20} color={Colors.neutral[400]} />;
}

function InfoNote({ text }: { text: string }) {
  return (
    <View style={s.infoNote}>
      <Ionicons name="information-circle-outline" size={14} color={Colors.neutral[400]} />
      <AppText style={s.infoTxt}>{text}</AppText>
    </View>
  );
}

function CenteredSpinner() {
  return <ActivityIndicator color={RED} style={{ paddingVertical: 20 }} />;
}

function EmptyHint({ text }: { text: string }) {
  return <AppText style={{ color: Colors.neutral[400], fontSize: 13, paddingVertical: 12, textAlign: "center" }}>{text}</AppText>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingBottom: 8 },
  headerTitle: { fontSize: 16 },
  stepWrap:    { backgroundColor: "#fff", marginBottom: Spacing.sm },
  scroll:      { paddingBottom: 24 },
  sub:         { fontSize: 13, color: Colors.neutral[500] },
  divider:     { height: 0.5, backgroundColor: Colors.neutral[100], marginVertical: 6 },
  shippingAmt: { fontSize: 13, fontWeight: "600", color: Colors.neutral[700] },
  shippingFree:{ fontSize: 12, color: Colors.success, fontWeight: "600" },
  infoNote:    { flexDirection: "row", alignItems: "flex-start", gap: 6, margin: Spacing.sm, backgroundColor: Colors.neutral[50], padding: 10, borderRadius: Spacing.borderRadius.md },
  infoTxt:     { flex: 1, fontSize: 11, color: Colors.neutral[500], lineHeight: 16 },
});

const sb = StyleSheet.create({
  wrap:      { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: 14 },
  item:      { alignItems: "center", gap: 4 },
  dot:       { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.neutral[200], alignItems: "center", justifyContent: "center" },
  active:    { backgroundColor: RED },
  done:      { backgroundColor: RED },
  num:       { fontSize: 11, fontWeight: "600", color: Colors.neutral[500] },
  numActive: { color: "#fff" },
  label:     { fontSize: 10, color: Colors.neutral[400] },
  labelActive:{ color: RED, fontWeight: "600" },
  labelDone: { color: RED },
  line:      { flex: 1, height: 1.5, backgroundColor: Colors.neutral[200], marginBottom: 14, marginHorizontal: 2 },
  lineDone:  { backgroundColor: RED },
});

const sc = StyleSheet.create({
  card: { backgroundColor: "#fff", marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: 14 },
  hdr:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
});

const fi = StyleSheet.create({
  wrap:    { marginBottom: 10 },
  label:   { fontSize: 12, color: Colors.neutral[500], marginBottom: 4 },
  input:   { borderWidth: 1, borderColor: Colors.neutral[200], borderRadius: Spacing.borderRadius.md, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: Colors.neutral[900], backgroundColor: Colors.background.secondary },
  focused: { borderColor: RED, backgroundColor: "#fff" },
});

const or = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: Spacing.borderRadius.md, borderWidth: 1, borderColor: Colors.neutral[200], marginBottom: 8, backgroundColor: Colors.background.secondary },
  sel:      { borderColor: RED, backgroundColor: Colors.primary[25] },
  radio:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.neutral[300], alignItems: "center", justifyContent: "center" },
  radioSel: { borderColor: RED },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: RED },
  sub:      { fontSize: 11, color: Colors.neutral[400], marginTop: 1 },
});

const ab = StyleSheet.create({
  wrap:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.md, paddingTop: 10, borderTopWidth: 0.5, backgroundColor: "#fff" },
  back:    { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 10, paddingHorizontal: 4 },
  backTxt: { fontSize: 14, color: Colors.neutral[600] },
  next:    { backgroundColor: RED, paddingHorizontal: 24, paddingVertical: 11, borderRadius: Spacing.borderRadius.md, minWidth: 140, alignItems: "center" },
  nextDim: { opacity: 0.45 },
});

const pi = StyleSheet.create({
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  txt:   { color: "#fff", fontSize: 12, fontWeight: "700" },
});
