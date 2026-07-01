/**
 * src/hooks/useCheckout.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Toàn bộ state & business logic cho luồng checkout.
 * Không có JSX, không import RN components.
 *
 * Screen chỉ cần:
 *   const checkout = useCheckout(cartId);
 *   // dùng checkout.step, checkout.address, checkout.handleNext, v.v.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

import {
  CheckoutAddress,
  CheckoutResult,
  PaymentMethod,
  PlacedOrderStatus,
  ShippingMethod,
  fetchPaymentMethods,
  fetchPlacedOrderStatus,
  fetchShippingMethods,
  fetchUserDefaultAddress,
  patchCartAddress,
  patchCartShipping,
  placeOrder,
} from "@/src/services/liferay";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckoutStep = "address" | "shipping" | "payment" | "confirm";

export type PaymentStatus = "idle" | "waiting" | "polling" | "success" | "failed";

export interface UseCheckoutReturn {
  // ── State ──
  step:             CheckoutStep;
  loading:          boolean;
  address:          CheckoutAddress;
  shippingMethods:  ShippingMethod[];
  selectedShipping: ShippingMethod | null;
  paymentMethods:   PaymentMethod[];
  selectedPayment:  PaymentMethod | null;
  shippingFee:      number;

  // ── Payment result (dùng trong PaymentScreen) ──
  paymentStatus:    PaymentStatus;
  checkoutResult:   CheckoutResult | null;

  // ── Setters ──
  setAddress:          (addr: CheckoutAddress) => void;
  setSelectedShipping: (m: ShippingMethod) => void;
  setSelectedPayment:  (m: PaymentMethod) => void;

  // ── Actions ──
  handleNext:    () => Promise<void>;
  handleBack:    () => void;
  startPolling:  () => void;
  stopPolling:   () => void;
  retryPayment:  () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS        = 30;   // 90s timeout

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCheckout(
  cartId: number | null,
  initialTotal: number,
  /** Callback khi bước cuối xong – nhận result để navigate */
  onPlaceOrderSuccess: (result: CheckoutResult) => void,
  /** Callback khi back từ bước đầu tiên */
  onBackFromFirst: () => void,
): UseCheckoutReturn {

  // ── Step ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<CheckoutStep>("address");

  // ── Loading ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Address ───────────────────────────────────────────────────────────────
  const [address, setAddress] = useState<CheckoutAddress>({
    name: "", phone: "", street: "", ward: "", district: "", city: "Hồ Chí Minh",
  });
  const [addressLoaded, setAddressLoaded] = useState(false);

  // ── Shipping ──────────────────────────────────────────────────────────────
  const [shippingMethods,  setShippingMethods]  = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [shippingFee,      setShippingFee]       = useState(0);

  // ── Payment method ────────────────────────────────────────────────────────
  const [paymentMethods,  setPaymentMethods]  = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);

  // ── Payment result ────────────────────────────────────────────────────────
  const [paymentStatus,  setPaymentStatus]  = useState<PaymentStatus>("idle");
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);

  // ── Polling refs ──────────────────────────────────────────────────────────
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const toast = useCallback((type: "success" | "error", msg: string) => {
    Toast.show({ type, text1: msg, position: "bottom", visibilityTime: 2500 });
  }, []);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true);
    try { return await fn(); }
    catch (err: any) {
      console.error("[useCheckout]", err?.message ?? err);
      return null;
    }
    finally { setLoading(false); }
  }, []);

  // ─── Load user address on mount ───────────────────────────────────────────

  useEffect(() => {
    if (addressLoaded) return;
    (async () => {
      const info = await fetchUserDefaultAddress();
      if (info) {
        setAddress({
          name:     info.name,
          phone:    info.phone,
          street:   info.street,
          ward:     info.ward,
          district: info.district,
          city:     info.city || "Hồ Chí Minh",
        });
      }
      setAddressLoaded(true);
    })();
  }, [addressLoaded]);

  // ─── Cleanup polling ──────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  useEffect(() => () => { stopPolling(); }, []);

  // ─── Step actions ─────────────────────────────────────────────────────────

  /** BƯỚC 1 → lưu địa chỉ, load shipping methods */
  const submitAddress = useCallback(async (): Promise<boolean> => {
    if (!address.name.trim() || !address.phone.trim() || !address.street.trim()) {
      toast("error", "Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ");
      return false;
    }
    if (!cartId) { toast("error", "Không tìm thấy giỏ hàng"); return false; }

    const ok = await withLoading(() => patchCartAddress(cartId, address));
    if (ok === null) { toast("error", "Không lưu được địa chỉ, vui lòng thử lại"); return false; }

    // Load shipping methods song song với việc patch xong
    const methods = await withLoading(() => fetchShippingMethods(cartId));
    if (methods) {
      setShippingMethods(methods);
      if (methods.length > 0) setSelectedShipping(methods[0]);
    }
    return true;
  }, [address, cartId, withLoading, toast]);

  /** BƯỚC 2 → gán shipping method, load payment methods */
  const submitShipping = useCallback(async (): Promise<boolean> => {
    if (!selectedShipping) { toast("error", "Vui lòng chọn phương thức vận chuyển"); return false; }
    if (!cartId) return false;

    const ok = await withLoading(() => patchCartShipping(cartId, selectedShipping.id));
    if (ok === null) { toast("error", "Không lưu được phương thức vận chuyển"); return false; }

    setShippingFee(selectedShipping.amount);

    const methods = await withLoading(() => fetchPaymentMethods(cartId));
    if (methods) {
      setPaymentMethods(methods);
      if (methods.length > 0) setSelectedPayment(methods[0]);
    }
    return true;
  }, [selectedShipping, cartId, withLoading, toast]);

  /** BƯỚC 3 → validate payment method chọn */
  const submitPayment = useCallback((): boolean => {
    if (!selectedPayment) { toast("error", "Vui lòng chọn phương thức thanh toán"); return false; }
    return true;
  }, [selectedPayment, toast]);

  /** BƯỚC 4 → đặt hàng */
  const submitOrder = useCallback(async (): Promise<void> => {
    if (!cartId) return;

    const totalLabel = (initialTotal + shippingFee).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

    Alert.alert(
      "Xác nhận đặt hàng",
      `Tổng: ${totalLabel}\nThanh toán: ${selectedPayment?.name ?? "—"}`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đặt hàng",
          onPress: async () => {
            const result = await withLoading(() => placeOrder(cartId));
            if (!result) {
              toast("error", "Đặt hàng thất bại, vui lòng thử lại");
              return;
            }
            setCheckoutResult(result);
            setPaymentStatus(result.paymentUrl ? "waiting" : "polling");
            onPlaceOrderSuccess(result);
          },
        },
      ]
    );
  }, [cartId, initialTotal, shippingFee, selectedPayment, withLoading, toast, onPlaceOrderSuccess]);

  // ─── handleNext (dispatch theo step) ──────────────────────────────────────

  const handleNext = useCallback(async () => {
    if (step === "address") {
      const ok = await submitAddress();
      if (ok) setStep("shipping");
    } else if (step === "shipping") {
      const ok = await submitShipping();
      if (ok) setStep("payment");
    } else if (step === "payment") {
      if (submitPayment()) setStep("confirm");
    } else if (step === "confirm") {
      await submitOrder();
    }
  }, [step, submitAddress, submitShipping, submitPayment, submitOrder]);

  // ─── handleBack ────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (step === "address")  { onBackFromFirst(); return; }
    if (step === "shipping") setStep("address");
    else if (step === "payment")  setStep("shipping");
    else if (step === "confirm")  setStep("payment");
  }, [step, onBackFromFirst]);

  // ─── Polling ───────────────────────────────────────────────────────────────

  /**
   * Bắt đầu polling trạng thái đơn hàng.
   * Gọi từ PaymentScreen sau khi WebView đóng,
   * hoặc ngay khi đặt hàng xong (COD / phương thức offline).
   */
  const startPolling = useCallback(() => {
    if (!checkoutResult?.orderId) return;
    const orderId = checkoutResult.orderId;

    pollCount.current = 0;
    setPaymentStatus("polling");

    pollTimer.current = setInterval(async () => {
      try {
        pollCount.current += 1;

        const status: PlacedOrderStatus = await fetchPlacedOrderStatus(orderId);

        // PAID hoặc COMPLETED
        if (status.paymentStatus === 3 || status.orderStatus === 4) {
          stopPolling();
          setPaymentStatus("success");
          return;
        }

        // CANCELLED
        if (status.orderStatus === 5) {
          stopPolling();
          setPaymentStatus("failed");
          return;
        }

        // Timeout
        if (pollCount.current >= MAX_POLLS) {
          stopPolling();
          setPaymentStatus("failed");
        }
      } catch {
        // Giữ polling qua lỗi mạng nhất thời
      }
    }, POLL_INTERVAL_MS);
  }, [checkoutResult]);

  const retryPayment = useCallback(() => {
    setPaymentStatus("waiting");
  }, []);

  // ─── Return ────────────────────────────────────────────────────────────────

  return {
    step,
    loading,
    address,
    shippingMethods,
    selectedShipping,
    paymentMethods,
    selectedPayment,
    shippingFee,
    paymentStatus,
    checkoutResult,
    setAddress,
    setSelectedShipping,
    setSelectedPayment,
    handleNext,
    handleBack,
    startPolling,
    stopPolling,
    retryPayment,
  };
}
