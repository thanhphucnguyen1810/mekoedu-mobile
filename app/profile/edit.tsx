/**
 * app/profile/edit.tsx
 *
 * SETUP: Thêm vào package.json dependencies rồi chạy `npx expo install`:
 *   "expo-image-picker": "~17.0.11"
 *
 * APIs Liferay:
 *   GET    /v1.0/my-user-account                – load thông tin
 *   PATCH  /v1.0/user-accounts/{id}             – cập nhật họ tên, SĐT, địa chỉ
 *   POST   /v1.0/user-accounts/{id}/image       – upload ảnh (multipart/form-data)
 */

import { ENV } from "@/src/config/env";
import { http } from "@/src/config/httpClient";
import { useTheme } from "@/src/theme";
import type { UserInfo } from "@/src/types/liferay";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const BASE_URL = ENV.API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  givenName: string;
  familyName: string;
  alternateName: string;
  emailAddress: string;
  birthday: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressRegion: string;
  addressPostalCode: string;
  addressCountry: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapUserInfoToForm(u: UserInfo): FormState {
  const phone =
    (u as any).userAccountContactInformation?.telephones?.[0]?.phoneNumber ??
    "";
  const addr =
    (u as any).userAccountContactInformation?.postalAddresses?.[0] ?? {};
  return {
    givenName: u.givenName ?? "",
    familyName: u.familyName ?? "",
    alternateName: u.alternateName ?? "",
    emailAddress: u.emailAddress ?? "",
    birthday: (u as any).birthDate?.split("T")[0] ?? "",
    phone,
    addressStreet: addr.streetAddressLine1 ?? "",
    addressCity: addr.addressLocality ?? "",
    addressRegion: addr.addressRegion ?? "",
    addressPostalCode: addr.postalCode ?? "",
    addressCountry: addr.addressCountry ?? "VN",
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const { c, spacing } = useTheme();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [form, setForm] = useState<FormState>({
    givenName: "",
    familyName: "",
    alternateName: "",
    emailAddress: "",
    birthday: "",
    phone: "",
    addressStreet: "",
    addressCity: "",
    addressRegion: "",
    addressPostalCode: "",
    addressCountry: "VN",
  });
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await http.get<UserInfo>(
          "/o/headless-admin-user/v1.0/my-user-account"
        );
        setUserInfo(res.data);
        setForm(mapUserInfoToForm(res.data));
        const img = (res.data as any).image;
        if (img) setAvatarUri(`${BASE_URL}${img}`);
      } catch {
        Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Chọn ảnh từ thư viện ──────────────────────────────────────────────────
  const handlePickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permResult.status !== "granted") {
      Alert.alert(
        "Cần quyền truy cập",
        "Vui lòng cho phép truy cập thư viện ảnh trong Cài đặt."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  // ── Chụp ảnh từ camera ────────────────────────────────────────────────────
  const handleTakePhoto = async () => {
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permResult.status !== "granted") {
      Alert.alert("Cần quyền truy cập", "Vui lòng cho phép truy cập camera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
      setAvatarChanged(true);
    }
  };

  const handleAvatarPress = () => {
    Alert.alert("Đổi ảnh đại diện", "Chọn nguồn ảnh", [
      { text: "Chụp ảnh mới", onPress: handleTakePhoto },
      { text: "Chọn từ thư viện", onPress: handlePickImage },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  // ── Upload avatar ─────────────────────────────────────────────────────────
  const uploadAvatar = async (userId: number, uri: string) => {
    const fileName = uri.split("/").pop() ?? "avatar.jpg";
    const mimeType = fileName.toLowerCase().endsWith(".png")
      ? "image/png"
      : "image/jpeg";
    const formData = new FormData();
    formData.append("image", { uri, name: fileName, type: mimeType } as any);
    await http.post(
      `/o/headless-admin-user/v1.0/user-accounts/${userId}/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  };

  // ── PATCH thông tin ───────────────────────────────────────────────────────
  const patchUser = async (userId: number) => {
    const telephones = form.phone.trim()
      ? [{ phoneNumber: form.phone.trim(), primary: true, phoneType: "personal" }]
      : undefined;
    const postalAddresses =
      form.addressStreet.trim() || form.addressCity.trim()
        ? [
            {
              streetAddressLine1: form.addressStreet.trim(),
              addressLocality: form.addressCity.trim(),
              addressRegion: form.addressRegion.trim(),
              postalCode: form.addressPostalCode.trim(),
              addressCountry: form.addressCountry.trim() || "VN",
              primary: true,
            },
          ]
        : undefined;

    await http.patch(`/o/headless-admin-user/v1.0/user-accounts/${userId}`, {
      givenName: form.givenName.trim(),
      familyName: form.familyName.trim(),
      alternateName: form.alternateName.trim() || undefined,
      birthDate: form.birthday ? `${form.birthday}T00:00:00Z` : undefined,
      userAccountContactInformation:
        telephones || postalAddresses
          ? { telephones, postalAddresses }
          : undefined,
    });
  };

  // ── Lưu ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.givenName.trim() || !form.familyName.trim()) {
      Alert.alert("Thiếu thông tin", "Họ và tên không được để trống.");
      return;
    }
    if (!userInfo) return;
    setSaving(true);
    try {
      const userId = (userInfo as any).id as number;
      if (avatarChanged && avatarUri) await uploadAvatar(userId, avatarUri);
      await patchUser(userId);
      Alert.alert("Thành công ✓", "Hồ sơ đã được cập nhật.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Không thể lưu",
        err?.response?.data?.title ?? "Đã có lỗi xảy ra. Vui lòng thử lại."
      );
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  Sub-components - Tối ưu với React.memo để tránh re-render không cần thiết
  // ─────────────────────────────────────────────────────────────────────────

  const Field = useCallback(({
    label,
    value,
    onChange,
    placeholder,
    keyboardType = "default",
    editable = true,
    icon,
    fieldKey,
  }: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    placeholder?: string;
    keyboardType?: any;
    editable?: boolean;
    icon?: keyof typeof Ionicons.glyphMap;
    fieldKey?: string;
  }) => {
    return (
      <View style={styles.fieldWrapper}>
        <Text style={[styles.fieldLabel, { color: c.textSub }]}>{label}</Text>
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: editable ? c.bgSoft : c.border + "30",
              borderColor: c.border,
            },
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={c.textSub}
              style={{ marginRight: 10 }}
            />
          )}
          <TextInput
            ref={(ref) => {
              if (fieldKey && ref) {
                inputRefs.current[fieldKey] = ref;
              }
            }}
            value={value}
            onChangeText={onChange || (() => {})}
            placeholder={placeholder ?? label}
            placeholderTextColor={c.textSub + "70"}
            keyboardType={keyboardType}
            editable={editable}
            style={[
              styles.input,
              { color: editable ? c.text : c.textSub },
            ]}
            returnKeyType="next"
            blurOnSubmit={false}
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
          />
          {!editable && (
            <Ionicons name="lock-closed" size={13} color={c.textSub} />
          )}
        </View>
      </View>
    );
  }, [c]);

  const SectionHeader = useCallback(({ title }: { title: string }) => {
    return (
      <View
        style={[
          styles.sectionHeader,
          {
            borderBottomColor: c.border,
            marginHorizontal: spacing.layout.screenHorizontal,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: c.primary }]}>{title}</Text>
      </View>
    );
  }, [c, spacing]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator size="large" color={c.primary} />
        <Text style={{ color: c.textSub, marginTop: 12 }}>
          Đang tải thông tin...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.bg }]}>
      {/* Topbar */}
      <View
        style={[
          styles.topbar,
          {
            backgroundColor: c.bg,
            borderBottomColor: c.border,
            paddingHorizontal: spacing.layout.screenHorizontal,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.topbarTitle, { color: c.text }]}>
          Hồ sơ cá nhân
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[
            styles.savePill,
            { backgroundColor: c.primary, opacity: saving ? 0.6 : 1 },
          ]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.savePillText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ⚠️ Bỏ KeyboardAvoidingView để fix lỗi input */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardDismissMode="on-drag"
        scrollEnabled={true}
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatarSection,
            { backgroundColor: c.primary, paddingVertical: spacing.xl + 4 },
          ]}
        >
          <TouchableOpacity
            onPress={handleAvatarPress}
            activeOpacity={0.85}
            style={styles.avatarTouchable}
          >
            <View
              style={[
                styles.avatarRing,
                { borderColor: "rgba(255,255,255,0.4)" },
              ]}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImg}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: "rgba(255,255,255,0.18)" },
                  ]}
                >
                  <Ionicons name="person" size={44} color="#fff" />
                </View>
              )}
            </View>
            {/* Camera badge */}
            <View
              style={[
                styles.cameraBadge,
                { backgroundColor: c.primary, borderColor: "#fff" },
              ]}
            >
              <Ionicons name="camera" size={15} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={styles.avatarHint}>Nhấn để đổi ảnh đại diện</Text>

          {avatarChanged && (
            <View style={styles.changedBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#fff" />
              <Text style={styles.changedText}>Ảnh mới đã chọn</Text>
            </View>
          )}
        </View>

        {/* Email readonly */}
        <View
          style={{
            paddingHorizontal: spacing.layout.screenHorizontal,
            marginTop: 20,
          }}
        >
          <Field
            fieldKey="email"
            label="Email"
            value={form.emailAddress}
            icon="mail-outline"
            editable={false}
          />
        </View>

        {/* Thông tin cơ bản */}
        <SectionHeader title="Thông tin cơ bản" />
        <View style={{ paddingHorizontal: spacing.layout.screenHorizontal }}>
          <Field
            fieldKey="familyName"
            label="Họ"
            value={form.familyName}
            onChange={(v) => setForm((f) => ({ ...f, familyName: v }))}
            placeholder="Nhập họ"
            icon="person-outline"
          />
          <Field
            fieldKey="givenName"
            label="Tên"
            value={form.givenName}
            onChange={(v) => setForm((f) => ({ ...f, givenName: v }))}
            placeholder="Nhập tên"
            icon="person-outline"
          />
          <Field
            fieldKey="alternateName"
            label="Tên hiển thị"
            value={form.alternateName}
            onChange={(v) => setForm((f) => ({ ...f, alternateName: v }))}
            placeholder="Nickname (tuỳ chọn)"
            icon="at-outline"
          />
          <Field
            fieldKey="birthday"
            label="Ngày sinh"
            value={form.birthday}
            onChange={(v) => setForm((f) => ({ ...f, birthday: v }))}
            placeholder="YYYY-MM-DD"
            icon="calendar-outline"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Liên hệ */}
        <SectionHeader title="Liên hệ" />
        <View style={{ paddingHorizontal: spacing.layout.screenHorizontal }}>
          <Field
            fieldKey="phone"
            label="Số điện thoại"
            value={form.phone}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            placeholder="0901 234 567"
            icon="call-outline"
            keyboardType="phone-pad"
          />
        </View>

        {/* Địa chỉ */}
        <SectionHeader title="Địa chỉ" />
        <View style={{ paddingHorizontal: spacing.layout.screenHorizontal }}>
          <Field
            fieldKey="addressStreet"
            label="Số nhà, tên đường"
            value={form.addressStreet}
            onChange={(v) => setForm((f) => ({ ...f, addressStreet: v }))}
            placeholder="123 Nguyễn Trãi"
            icon="location-outline"
          />
          <Field
            fieldKey="addressCity"
            label="Thành phố"
            value={form.addressCity}
            onChange={(v) => setForm((f) => ({ ...f, addressCity: v }))}
            placeholder="Cần Thơ"
            icon="business-outline"
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                fieldKey="addressRegion"
                label="Tỉnh / Vùng"
                value={form.addressRegion}
                onChange={(v) => setForm((f) => ({ ...f, addressRegion: v }))}
                placeholder="ĐBSCL"
                icon="map-outline"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                fieldKey="addressPostalCode"
                label="Mã bưu chính"
                value={form.addressPostalCode}
                onChange={(v) =>
                  setForm((f) => ({ ...f, addressPostalCode: v }))
                }
                placeholder="90000"
                icon="mail-outline"
                keyboardType="numeric"
              />
            </View>
          </View>
          <Field
            fieldKey="addressCountry"
            label="Quốc gia (mã ISO)"
            value={form.addressCountry}
            onChange={(v) => setForm((f) => ({ ...f, addressCountry: v }))}
            placeholder="VN"
            icon="globe-outline"
          />
        </View>

        {/* Nút lưu lớn */}
        <View
          style={{
            paddingHorizontal: spacing.layout.screenHorizontal,
            marginTop: 28,
          }}
        >
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[
              styles.saveLarge,
              { backgroundColor: c.primary, opacity: saving ? 0.6 : 1 },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
                <Text style={styles.saveLargeText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  topbar: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderBottomWidth: 0.5,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  topbarTitle: {
    flex: 1,
    fontWeight: "700",
    fontSize: 17,
    textAlign: "center",
  },
  savePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 4,
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    height: 36,
  },
  savePillText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  avatarSection: { alignItems: "center" },
  avatarTouchable: { position: "relative" },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: "hidden",
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    elevation: 3,
  },
  avatarHint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    marginTop: 12,
  },
  changedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  changedText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  sectionHeader: {
    paddingBottom: 8,
    paddingTop: 24,
    borderBottomWidth: 0.5,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  fieldWrapper: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },

  saveLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    height: 52,
  },
  saveLargeText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
