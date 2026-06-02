/**
 * liferayService.ts
 * Liferay DXP – Auth (OAuth2) + Headless Commerce Catalog API
 * CHỈ DÙNG USER TOKEN, KHÔNG DÙNG CLIENT CREDENTIALS
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosRequestConfig } from "axios";
import Constants from "expo-constants";
import { ENV } from "../types/env";
import { api } from "./api";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  getUserToken,
} from "./tokenService";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const CHANNEL_ID = ENV.CHANNEL_ID;
const SITE_ID = ENV.SITE_ID;

// Hàm sửa URL ảnh DỰA THEO BASE_URL
const fixImageUrl = (url: string) => {
  if (!url) return "";

  // Lấy domain từ BASE_URL (bỏ qua http hay https)
  const domain = ENV.API_URL.replace(/^https?:\/\//, "");

  // Nếu URL ảnh có domain trùng với BASE_URL
  if (url.includes(domain)) {
    // Thay thế protocol bằng protocol của BASE_URL
    const protocol = ENV.API_URL.startsWith("https") ? "https://" : "http://";
    return url.replace(/^https?:\/\//, protocol);
  }

  return url;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiferayTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LiferayUserInfo {
  id: number;
  emailAddress: string;
  givenName: string;
  familyName: string;
  alternateName: string;
  roleBriefs?: { id: number; name: string }[];
}

export interface RegisterPayload {
  emailAddress: string;
  password: string;
  givenName: string;
  familyName: string;
  screenName?: string;
}

export interface LiferayCatalogProduct {
  id: number;
  productId: number;
  name: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  price?: number;
  promoPrice?: number;
  catalogName?: string;
  categories?: { id: number; name: string }[];
  productSpecifications?: {
    specificationKey: string;
    specificationTitle?: string;
    value: string;
  }[];
  createDate?: string;
  modifiedDate?: string;
  skus?: { price: number; promoPrice: number; sku: string }[];
  images?: { id: number; url: string; src?: string }[];
}

export interface LiferayCategory {
  id: number;
  name: string;
  parentCategoryId?: number;
  numberOfTaxonomyCategories?: number;
  taxonomyCategoryId?: number;
}

export interface LiferayProductList {
  items: LiferayCatalogProduct[];
  page: number;
  pageSize: number;
  totalCount: number;
  lastPage: number;
}

// ─── Helper functions ─────────────────────────────────────────────────────────

async function fetchJSON<T>(
  endpoint: string,
  config: AxiosRequestConfig = {},
): Promise<T> {
  console.log("📡 Fetching:", endpoint);

  try {
    const response = await api.request<T>({
      url: endpoint,
      method: config.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...config.headers,
      },
      ...config,
    });

    const dataAny = response.data as any;

    if (dataAny && typeof dataAny === "object") {
      if ("items" in dataAny && Array.isArray(dataAny.items)) {
        dataAny.items = dataAny.items.map((product: any) => ({
          ...product,
          images: product.images?.map((img: any) => ({
            ...img,
            src: fixImageUrl(img.src || img.url),
          })),
        }));
      } else if (dataAny.images && Array.isArray(dataAny.images)) {
        dataAny.images = dataAny.images.map((img: any) => ({
          ...img,
          src: fixImageUrl(img.src || img.url),
        }));
      }
    }

    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = error.response?.data;
      console.error("--- API ERROR ---");
      console.error("URL:", endpoint);
      console.error("Status:", status);
      console.error("Response:", responseData);
      throw new Error(
        status ? `[API ${status}]` : error.message || "Unknown API error",
      );
    }

    throw error;
  }
}

// ─── 2. Register User ─────────────────────────────────────────────────────────
/**
 * Tạo tài khoản mới trên Liferay.
 * Flow:
 *   1. Lấy client_credentials token (không cần user login)
 *   2. POST /o/headless-admin-user/v1.0/user-accounts để tạo user
 *
 * Lưu ý: Liferay mặc định yêu cầu password có chữ hoa + số.
 * Tắt tại: Control Panel → Password Policies → Default.
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<LiferayUserInfo> {
  const credentials = btoa(`${ENV.CLIENT_ID}:${ENV.CLIENT_SECRET}`);

  // Bước 1: Lấy client_credentials token
  const tokenRes = await fetch(`${ENV.API_URL}/o/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    console.error("❌ Cannot get client token:", tokenData);
    throw new Error(tokenData.error_description || "Không thể kết nối server");
  }

  const clientToken: string = tokenData.access_token;

  // Bước 2: Sinh screenName nếu không truyền vào
  const screenName =
    payload.screenName ??
    payload.emailAddress
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase() + Math.floor(Math.random() * 9000 + 1000);

  // Bước 3: Tạo user
  const createRes = await fetch(
    `${ENV.API_URL}/o/headless-admin-user/v1.0/user-accounts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${clientToken}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        emailAddress: payload.emailAddress.trim(),
        givenName: payload.givenName.trim(),
        familyName: payload.familyName.trim(),
        alternateName: screenName,
        password: payload.password,
      }),
    },
  );

  const createData = await createRes.json();

  if (!createRes.ok) {
    console.error("❌ Register failed:", createData);
    // Liferay trả lỗi dạng { title, detail, status } hoặc { message }
    const msg =
      createData.detail ||
      createData.title ||
      createData.message ||
      `[API ${createRes.status}] Đăng ký thất bại`;
    throw new Error(msg);
  }

  console.log("Register successful:", createData.emailAddress);
  return createData as LiferayUserInfo;
}

// ─── 1. User Login ───────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  if (!email || !password) {
    console.error("❌ Missing email or password");
    throw new Error("Email and password are required");
  }

  const emailStr = String(email).trim();
  const passwordStr = String(password);

  if (!emailStr) {
    throw new Error("Email cannot be empty");
  }

  // Dùng Basic Auth thay vì body params
  const credentials = btoa(`${ENV.CLIENT_ID}:${ENV.CLIENT_SECRET}`);

  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("username", emailStr);
  params.append("password", passwordStr);
  console.log("🔐 Logging in with email:", emailStr);

  try {
    const response = await fetch(`${ENV.API_URL}/o/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Login failed:", data);
      throw new Error(data.error_description || data.error || "Login failed");
    }

    if (data.access_token) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      console.log("✅ Access token saved");
    }

    if (data.refresh_token) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      console.log("✅ Refresh token saved");
    }

    console.log("✅ Login successful for:", emailStr);
    return data;
  } catch (error) {
    console.error("❌ Login error:", error);
    throw error;
  }
}

// ─── 2. Refresh Token ────────────────────────────────────────────────────────
// Token refresh is delegated to ./tokenService.ts to avoid circular imports.

// ─── 3. Logout ───────────────────────────────────────────────────────────────
export async function logoutUser() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  console.log("Logged out, tokens removed");
}

// ─── 4. Get current user info ────────────────────────────────────────────────
export async function getMyUserInfo(): Promise<LiferayUserInfo | null> {
  const token = await getUserToken();
  if (!token) {
    console.warn("No user token found");
    return null;
  }

  return fetchJSON<LiferayUserInfo>(
    "/o/headless-admin-user/v1.0/my-user-account",
  );
}

// ─── 5. Get products from Commerce Channel ───────────────────────────────────
export async function getProducts(
  params: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
    sort?: string;
  } = {},
): Promise<LiferayProductList> {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");
  if (!CHANNEL_ID) throw new Error("Chưa cấu hình LIFERAY_CHANNEL_ID");

  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("pageSize", String(params.pageSize ?? 20));
  qs.set("nestedFields", "skus,productSpecifications,images,categories");
  qs.set("accept", "application/json");

  if (params.search) qs.set("search", params.search);
  if (params.sort) qs.set("sort", params.sort);
  if (params.categoryId) {
    qs.set("filter", `categories/id eq ${params.categoryId}`);
  }

  const endpoint = `/o/headless-commerce-delivery-catalog/v1.0/channels/${CHANNEL_ID}/products?${qs.toString()}`;

  console.log("Product URL:", endpoint);
  return fetchJSON<LiferayProductList>(endpoint);
}

// ─── 6. Get product detail ───────────────────────────────────────────────────
export async function getProduct(
  productId: number,
): Promise<LiferayCatalogProduct> {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");
  if (!CHANNEL_ID) throw new Error("Chưa cấu hình LIFERAY_CHANNEL_ID");

  const endpoint = `/o/headless-commerce-delivery-catalog/v1.0/channels/${CHANNEL_ID}/products/${productId}?nestedFields=skus,productSpecifications,images,categories`;
  const data = await fetchJSON<LiferayCatalogProduct>(endpoint);
  if (data.images) {
    data.images = data.images.map((img: any) => ({
      ...img,
      src: fixImageUrl(img.src),
    }));
  }
  return data;
}

// ─── 7. Get categories (Taxonomy) ────────────────────────────────────────────
export async function getCategories(
  vocabularyId?: string,
): Promise<{ items: LiferayCategory[] }> {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  if (vocabularyId) {
    const endpoint = `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${vocabularyId}/taxonomy-categories?pageSize=100`;
    return fetchJSON<{ items: LiferayCategory[] }>(endpoint);
  }

  const vocabsEndpoint = `/o/headless-admin-taxonomy/v1.0/sites/${SITE_ID}/taxonomy-vocabularies?pageSize=10`;
  const vocabs = await fetchJSON<{ items: { id: number; name: string }[] }>(
    vocabsEndpoint,
  );

  if (!vocabs.items?.length) {
    return { items: [] };
  }

  const firstVocabId = vocabs.items[0].id;
  const categoriesEndpoint = `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${firstVocabId}/taxonomy-categories?pageSize=100`;
  return fetchJSON<{ items: LiferayCategory[] }>(categoriesEndpoint);
}

// ─── 8. Get structured contents (courses/articles) ───────────────────────────
export async function getStructuredContents(
  siteId?: string,
  pageSize: number = 10,
  page: number = 1,
) {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  const targetSiteId = siteId ?? SITE_ID;
  const endpoint = `/o/headless-delivery/v1.0/sites/${targetSiteId}/structured-contents?pageSize=${pageSize}&page=${page}`;

  return fetchJSON<any>(endpoint);
}

// ─── 9. Get channels (Commerce Channels) ─────────────────────────────────────
export async function getChannels() {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  const endpoint = `/o/headless-commerce-admin-catalog/v1.0/channels?pageSize=100`;
  return fetchJSON<{ items: { id: number; name: string }[] }>(endpoint);
}

// ─── 10. Get catalog information ─────────────────────────────────────────────
export async function getCatalogs() {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  const endpoint = `/o/headless-commerce-admin-catalog/v1.0/catalogs?pageSize=100`;
  return fetchJSON<{ items: { id: number; name: string }[] }>(endpoint);
}

// ─── Shortcut helpers ────────────────────────────────────────────────────────
export async function getProductsByCategory(
  categoryId: number,
  page = 1,
  pageSize = 20,
) {
  return getProducts({ categoryId, page, pageSize });
}

export async function searchProducts(keyword: string, page = 1, pageSize = 20) {
  return getProducts({ search: keyword, page, pageSize });
}

// ─── Check if user is authenticated ──────────────────────────────────────────
export async function isAuthenticated(): Promise<boolean> {
  const token = await getUserToken();
  if (!token) return false;

  try {
    const userInfo = await getMyUserInfo();
    return userInfo !== null;
  } catch {
    return false;
  }
}

export { getUserToken, refreshAccessToken } from "./tokenService";
