/** API mapping:
 *  Headless Delivery Cart   → /o/headless-commerce-delivery-cart/v1.0
 *  Headless Delivery Order  → /o/headless-commerce-delivery-order/v1.0
 *  Headless Admin User      → /o/headless-admin-user/v1.0
 */

import { ENV } from "@/src/config/env";
import { getUserToken } from "./authService";
import { ensureUserAccount } from "./userService";
import axios from "axios";
 
const BASE = ENV.API_URL.endsWith("/")
  ? ENV.API_URL.slice(0, -1)
  : ENV.API_URL;
 
const CART  = `${BASE}/o/headless-commerce-delivery-cart/v1.0`;
const ORDER = `${BASE}/o/headless-commerce-delivery-order/v1.0`;
const USER  = `${BASE}/o/headless-admin-user/v1.0`;

// Types
export interface CheckoutAddress {
  name:     string;
  phone:    string;
  street:   string;   // street1
  ward:     string;   // street2
  district: string;   // street3
  city:     string;
  countryISOCode?: string;
}

export interface ShippingMethod {
  id: number;
  key:         string;
  name:        string;
  description: string;
  amount:      number;
}

export interface PaymentMethod {
  id: number;
  key: string;
  name: string;
  description: string;
  paymentMethodType?: string;
}

export interface UserAddressInfo {
  name:     string;
  phone:    string;
  street:   string;
  ward:     string;
  district: string;
  city:     string;
}

export interface CheckoutResult {
  orderId:    number;
  paymentUrl: string | null;
  orderStatus?: string;
  orderTotal?: number;
}

export interface PlacedOrderStatus {
  orderId: number;
  orderStatus:   number; // 1=OPEN 2=IN_PROGRESS 3=PENDING 4=COMPLETED 5=CANCELLED
  paymentStatus: number; // 1=PENDING 2=AUTHORIZED 3=PAID
  orderStatusLabel: string;   // Thêm label để UI dễ hiển thị
  paymentStatusLabel: string; // Thêm label
  isCompleted: boolean;
  isFailed: boolean;
  isPending: boolean;
  paymentUrl?: string | null; // Nếu có custom field
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
 
async function authHeader(): Promise<{ Authorization: string; "Content-Type": string }> {
  const token = await getUserToken();
  if (!token) throw new Error("No auth token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ─── User address ─────────────────────────────────────────────────────────────
 
/**
 * Lấy địa chỉ mặc định của user từ Liferay.
 * Kết hợp: postal address (địa chỉ) + my-user-account (tên, phone).
 * Trả về null nếu không có – UI sẽ hiện form trống để user nhập.
 */

export async function fetchUserDefaultAddress(): Promise<UserAddressInfo | null> {
  try {
    const headers = await authHeader();
    const accountId = await ensureUserAccount();

    // gọi 2 API song song
    const [meRes, addrRes] = await Promise.allSettled([
      axios.get(`${USER}/my-user-account`, { headers }),  // lấy thông tin cá nhân
      accountId ? axios.get(`${USER}/accounts/${accountId}/postal-addresses`, { headers }) : Promise.reject("no accountId") // lấy danh sách địa chỉ
    ]);

    const me = meRes.status === "fulfilled" ? meRes.value.data: null;
    const addrs = addrRes.status === "fulfilled" ? (addrRes.value.data?.items ?? []) : [] ;

    const primary = addrs[0] ?? null;

    return {
      name:     primary?.name     ?? (me ? `${me.givenName ?? ""} ${me.familyName ?? ""}`.trim() : ""),
      phone:    primary?.phoneNumber ?? me?.phoneNumber ?? "",
      street:   primary?.street1  ?? "",
      ward:     primary?.street2  ?? "",
      district: primary?.street3  ?? "",
      city:     primary?.city     ?? "",
    }
  } catch (err) {
    console.warn("[checkoutService] fetchUserDefaultAddress:", err);
    return null;
  }
}

// ─── Cart patches ─────────────────────────────────────────────────────────────
 
/**
 * Lưu địa chỉ giao hàng vào cart.
 * Dùng cùng địa chỉ cho cả shipping & billing
 *
 * API: PATCH /carts/{cartId}
 */
function mapAddress(a: CheckoutAddress) {
  return {
    name: a.name,
    phoneNumber: a.phone,
    street1: a.street,
    street2: a.ward,
    street3: a.district,
    city: a.city,
    countryISOCode: a.countryISOCode ?? "VN",
  };
}

export async function patchCartAddress(
  cartId: number,
  addr: CheckoutAddress,
  options?: { useSameForBilling?: boolean; billingAddr?: CheckoutAddress }
): Promise<void> {

  const headers = await authHeader();
  const billing = options?.useSameForBilling !== false ? addr : options?.billingAddr;

  const body = {
    shippingAddress: mapAddress(addr),
    billingAddress: billing ? mapAddress(billing) : undefined,
  };

  try {
    const response = await axios.patch(`${CART}/carts/${cartId}`, body, { headers });
    if (response.status < 200 && response.status > 300) {
      throw new Error(`Patch cart failed: ${response.status}`);
    }
    // có thể log thành công
  } catch (error) {
    console.error("[patchCartAddress] Lỗi cập nhật địa chỉ:", error);
    throw error;
  }
}

/**
 * Gán shipping method vào cart.
 * @param cartId - ID của giỏ hàng
 * @param shippingMethodId - ID của phương thức vận chuyển (lấy từ API shipping-methods)
 *  Cập nhật phương thức vận chuyển đã chọn vào cart để Liferay tính phí ship chính xác khi checkout.
// Lấy danh sách shipping methods
const methods = await fetchShippingMethods(cartId);
// methods.items[0].id là number
const selectedId = methods.items[0].id; // ví dụ: 12345
// Gán vào cart
await patchCartShipping(cartId, selectedId);

*/

export async function patchCartShipping(
  cartId: number,
  shippingMethodId: number   // key tương ứng vd như: "flat-rate", "variable-rate"
): Promise<void> {
  if (!cartId || !shippingMethodId) throw new Error("Invalid cartId or shippingMethodId");

  const headers = await authHeader();

  try {
    const response = await axios.patch(
      `${CART}/carts/${cartId}`,
      { shippingMethodId },
      { headers }
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status}`);
    }
    console.debug(`Shipping method ${shippingMethodId} applied to cart ${cartId}`);
  } catch (error) {
    console.error(`Failed to update shipping for cart ${cartId}:`, error);
    throw error;
  }
}

// ─── Shipping & payment methods ───────────────────────────────────────────────
 
/** API: GET /carts/{cartId}/shipping-methods
 */
export async function fetchShippingMethods(cartId: number): Promise<ShippingMethod[]> {
  const headers = await authHeader();
  const res = await axios.get(`${CART}/carts/${cartId}/shipping-methods`, { headers });
  return (res.data?.items ?? []).map((m: any) => ({
    id: m.id,                     // Lấy id để gán vào cart
    name: m.name,
    description: m.description,
    engineKey: m.engineKey,
    shippingOptions: (m.shippingOptions ?? []).map((opt: any) => ({
      name: opt.name,
      amount: opt.amount,
    })),
  }));
}


/** Lấy danh sách phương thức thanh toán
 * API: GET /carts/{cartId}/payment-methods
 */
export async function fetchPaymentMethods(cartId: number): Promise<PaymentMethod[]>  {
  if (!cartId || isNaN(cartId)) {
    throw new Error(`Invalid cartId: ${cartId}`);
  }
  const headers = await authHeader();
  try {
    const res = await axios.get(`${CART}/carts/${cartId}/payment-methods`, { headers });
    const items = res.data?.items ?? [];
    console.debug(` Fetched ${items.length} payment methods for cart ${cartId}`);
    return items.map((m: any): PaymentMethod => ({
      id: m.id ?? 0,
      key: m.key ?? "",
      name: m.name ?? "",
      description: m.description ?? "",
      paymentMethodType: m.paymentMethodType ?? "",
    }));
  } catch (error) {
    console.error(` Failed to fetch payment methods for cart ${cartId}:`, error);
    throw error;
  }
}

/**
 * Để thực sự chọn được MoMo hay VNPay từ app, bạn cần:
Cách 1: Cấu hình mặc định trên Admin (như đã nói).
Cách 2: Tự tạo Custom Payment Method và lưu lựa chọn vào Custom Field của Order (cần code Java).

 */

// ----------------
export async function placeOrder(cartId: number): Promise<CheckoutResult> {
  if (!cartId || isNaN(cartId)) {
    throw new Error(`Invalid cartId: ${cartId}`);
  }

  const headers = await authHeader();

  try {
    const res = await axios.post(`${CART}/carts/${cartId}/checkout`, {}, { headers });
    
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = res.data;
    if (!data) {
      throw new Error("Empty response from checkout API");
    }

    const orderId = data.id ?? data.orderId;
    if (!orderId) {
      throw new Error("No order ID returned from checkout");
    }

    const paymentUrl = data.paymentURL ?? data.redirectURL ?? null;
    console.debug(` Order ${orderId} placed successfully, paymentUrl: ${paymentUrl ? "yes" : "no"}`);

    return {
      orderId,
      paymentUrl,
      orderStatus: data.orderStatus ?? null,
      orderTotal: data.total ?? null,
    };
  } catch (error) {
    console.error(` Place order failed for cart ${cartId}:`, error);
    throw error;
  }
}

const ORDER_STATUS_MAP: Record<number, string> = {
  1: "OPEN",
  2: "IN_PROGRESS",
  3: "PENDING",
  4: "COMPLETED",
  5: "CANCELLED",
};

const PAYMENT_STATUS_MAP: Record<number, string> = {
  0: "NOT_PAID",
  1: "PENDING",
  2: "AUTHORIZED",
  3: "PAID",
  4: "FAILED",
};

// ─── Polling function ──────────────────────────────────────────────────────────

/**
 * Lấy trạng thái đơn hàng đã đặt.
 *
 * API: GET /placed-orders/{placedOrderId} (Headless Delivery Order)
 *
 * orderStatus:   1=OPEN, 2=IN_PROGRESS, 3=PENDING, 4=COMPLETED, 5=CANCELLED
 * paymentStatus: 0=NOT_PAID, 1=PENDING, 2=AUTHORIZED, 3=PAID, 4=FAILED
 */
export async function fetchPlacedOrderStatus(orderId: number): Promise<PlacedOrderStatus> {
  // Validate input
  if (!orderId || isNaN(orderId)) {
    throw new Error(`Invalid orderId: ${orderId}`);
  }

  const headers = await authHeader();

  try {
    const res = await axios.get(`${ORDER}/placed-orders/${orderId}`, { headers });

    // Check HTTP status
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = res.data;
    if (!data) {
      throw new Error("Empty response from order status API");
    }

    // Extract status values with fallbacks
    const orderStatus = data.orderStatus ?? data.workflowStatusInfo?.code ?? 0;
    const paymentStatus = data.paymentStatus ?? 0;

    // Get paymentUrl from custom fields (if stored)
    const paymentUrl = data.customFields?.paymentUrl ?? null;

    // Compute derived statuses
    const isCompleted = orderStatus === 4 && paymentStatus === 3;
    const isFailed = paymentStatus === 4 || orderStatus === 5;
    const isPending = orderStatus === 3 || paymentStatus === 1;

    console.debug(`Order ${orderId}: orderStatus=${orderStatus}, paymentStatus=${paymentStatus}`);

    return {
      orderId,
      orderStatus,
      paymentStatus,
      orderStatusLabel: ORDER_STATUS_MAP[orderStatus] ?? "UNKNOWN",
      paymentStatusLabel: PAYMENT_STATUS_MAP[paymentStatus] ?? "UNKNOWN",
      isCompleted,
      isFailed,
      isPending,
      paymentUrl,
    };
  } catch (error) {
    console.error(`Failed to fetch order status for order ${orderId}:`, error);
    throw error; // Re-throw để caller xử lý
  }
}

