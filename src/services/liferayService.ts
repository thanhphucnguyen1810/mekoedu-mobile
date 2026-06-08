import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

const BASE_URL = extra.LIFERAY_BASE_URL ?? "http://192.168.2.152:8080";
const CLIENT_ID = extra.LIFERAY_CLIENT_ID ?? "id-2a5344c9-dfb3-92b3-e5fd-ecb50b73536";
const CLIENT_SECRET = extra.LIFERAY_CLIENT_SECRET ?? "secret-7f2d4270-6b84-de1d-68d2-7c4e430d965";
const CHANNEL_ID = extra.LIFERAY_CHANNEL_ID ?? "33290";
const SITE_ID = extra.LIFERAY_SITE_ID ?? "20117";

const fixImageUrl = (url: string) => {
  if (!url) return '';
  
  // Lấy domain từ BASE_URL (bỏ qua http hay https)
  const domain = BASE_URL.replace(/^https?:\/\//, '');
  
  // Nếu URL ảnh có domain trùng với BASE_URL
  if (url.includes(domain)) {
    // Thay thế protocol bằng protocol của BASE_URL
    const protocol = BASE_URL.startsWith('https') ? 'https://' : 'http://';
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
  accountBriefs?: {
    id: number;
    name: string;
    externalReferenceCode?: string;
  }[];
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
  productId?: number;
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

export async function getUserToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('access_token');
    if (token) {
      console.log("User token found");
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
}

async function getClientToken(): Promise<string | null> {
  try {
    const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    const response = await axios.post(
      `${BASE_URL}/o/oauth2/token`,
      new URLSearchParams({ grant_type: "client_credentials" }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("❌ Lỗi lấy client token:", error);
    return null;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed (token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function refreshTokenIfNeeded(): Promise<string | null> {
  const refreshToken = await AsyncStorage.getItem('refresh_token');
  if (!refreshToken) return null;
  
  try {
    const newTokens = await refreshAccessToken(refreshToken);
    return newTokens.access_token;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    await logoutUser();
    return null;
  }
}

async function axiosRequest<T>(url: string, token: string, options: any = {}, retryCount = 0): Promise<T> {
  console.log("Fetching:", url);
  const maxRetries = 2;
  
  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
        ...options.headers,
      },
      data: options.body,
      params: options.params,
      timeout: 30000,
    });

    console.log(`Response Status: ${response.status}`);
    const contentType = String(response.headers["content-type"] || "");
    if (contentType.includes("xml") || contentType.includes("text/html")) {
      console.error("API returned XML/HTML instead of JSON!");
      throw new Error("Invalid API response format. Please check endpoint URL.");
    }

    let data = response.data;
    
    // xử lý images
    if (data && typeof data === 'object') {
      // Nếu là ProductList (có items)
      if ('items' in data && Array.isArray(data.items)) {
        data.items = data.items.map((product: any) => ({
          ...product,
          images: product.images?.map((img: any) => ({
            ...img,
            src: fixImageUrl(img.src || img.url)
          }))
        }));
      }
      // Nếu là single product (có images)
      else if (data.images && Array.isArray(data.images)) {
        data.images = data.images.map((img: any) => ({
          ...img,
          src: fixImageUrl(img.src || img.url)
        }));
      }
    }
    
    return data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      console.error("--- API ERROR ---");
      console.error("URL:", url);
      console.error("Status:", status);

      // Nếu là 401 và còn lượt retry
      if (status === 401 && retryCount < maxRetries) {
        console.log('Token expired, attempting refresh...');

        //Nếu đang refresh, đợi refresh xong
         if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshSubscribers.push(async (newToken) => {
              try {
                const result = await axiosRequest(url, newToken, options, retryCount + 1);
                resolve(result);
              } catch (err) {
                reject(err);
              }
            });
          });
        }
        
        isRefreshing = true;
        
        try {
          const newToken = await refreshTokenIfNeeded();
          if (newToken) {
            console.log("✅ Token refreshed successfully");
            onRefreshed(newToken);
            // Thử lại request với token mới
            return await axiosRequest(url, newToken, options, retryCount + 1);
          } else {
            throw new Error("Cannot refresh token");
          }
        } finally {
          isRefreshing = false;
        }
      }
      
      console.error("Response:", JSON.stringify(axiosError.response?.data)?.substring(0, 500));
      throw new Error(`[API ${status}]`);
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
export async function registerUser(payload: RegisterPayload): Promise<LiferayUserInfo> {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
 
  // Bước 1: Lấy client_credentials token
  const tokenResponse = await axios.post(
    `${BASE_URL}/o/oauth2/token`,
    new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
    }
  );
 
  const tokenData = tokenResponse.data;
 
  if (!tokenResponse.status.toString().startsWith('2')) {
    console.error("Cannot get client token:", tokenData);
    throw new Error(tokenData.error_description || "Không thể kết nối server");
  }
 
  const clientToken: string = tokenData.access_token;
 
  // Bước 2: Sinh screenName nếu không truyền vào
  const screenName =
    payload.screenName ??
    payload.emailAddress
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase() +
      Math.floor(Math.random() * 9000 + 1000);
 
  // Bước 3: Tạo user
  try {
    const createResponse = await axios.post(
      `${BASE_URL}/o/headless-admin-user/v1.0/user-accounts`,
      {
        emailAddress: payload.emailAddress.trim(),
        givenName: payload.givenName.trim(),
        familyName: payload.familyName.trim(),
        alternateName: screenName,
        password: payload.password,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${clientToken}`,
          "Accept": "application/json",
        },
      }
    );
 
    console.log("Register successful:", createResponse.data.emailAddress);
    return createResponse.data as LiferayUserInfo;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Register failed:", error.response.data);
      const createData = error.response.data;
      // Liferay trả lỗi dạng { title, detail, status } hoặc { message }
      const msg =
        createData.detail ||
        createData.title ||
        createData.message ||
        `[API ${error.response.status}] Đăng ký thất bại`;
      throw new Error(msg);
    }
    throw error;
  }
}


// ─── 1. User Login ───────────────────────────────────────────────────────────
export async function loginUser(email: string, password: string) {
  if (!email || !password) {
    console.error("Missing email or password");
    throw new Error("Email and password are required");
  }

  const emailStr = String(email).trim();
  const passwordStr = String(password);

  if (!emailStr) {
    throw new Error("Email cannot be empty");
  }

  // Dùng Basic Auth thay vì body params
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  
  const params = new URLSearchParams();
  params.append('grant_type', 'password');
  params.append('username', emailStr);
  params.append('password', passwordStr);

  console.log("Logging in with email:", emailStr);

  try {
    const response = await axios.post(
      `${BASE_URL}/o/oauth2/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${credentials}`,
        },
      }
    );

    const data = response.data;
    
    if (data.access_token) {
      await AsyncStorage.setItem('access_token', data.access_token);
      console.log("Access token saved");
    }
    
    if (data.refresh_token) {
      await AsyncStorage.setItem('refresh_token', data.refresh_token);
      console.log("Refresh token saved");
    }

    let userInfo = null;
    let cartId = null;

    try {
      // Đợi token có hiệu lực
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userInfo = await getMyUserInfo();
      if (userInfo?.id) {
        console.log(`📋 User ID: ${userInfo.id}`);
        const accountId = userInfo.accountBriefs?.[0]?.id;
        console.log(`🏢 Account ID: ${accountId}`);

        // Kiểm tra cart đã có trong storage chưa
        const savedCartId = await getSavedCartId();
        if (savedCartId) {
          console.log(`📦 Using existing cart from storage: ${savedCartId}`);
          cartId = savedCartId;
        } else {
          console.log(`🛒 No cart found in storage. Set to null (will create on-demand).`);
          cartId = null;
          await AsyncStorage.removeItem('cart_id');
        }
      }
    } catch (err) {
      console.log("⚠️ Could not fetch cart after login:", err);
    }

    console.log("Login successful for:", emailStr);
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      userInfo: userInfo,
      cartId: cartId
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("Login failed:", error.response.data);
      throw new Error(error.response.data.error_description || error.response.data.error || "Login failed");
    }
    console.error("Login error:", error);
    throw error;
  }
}

// ─── 2. Refresh Token ────────────────────────────────────────────────────────
export async function refreshAccessToken(refreshToken: string): Promise<LiferayTokenResponse> {
  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await axios.post(
    `${BASE_URL}/o/oauth2/token`,
    body.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
    }
  );

  const data = response.data;

  await AsyncStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) {
    await AsyncStorage.setItem('refresh_token', data.refresh_token);
  }

  return data;
}

// ─── 3. Logout ───────────────────────────────────────────────────────────────
export async function logoutUser() {
  await AsyncStorage.removeItem('access_token');
  await AsyncStorage.removeItem('refresh_token');
  console.log("Logged out, tokens removed");
}

// ─── 4. Get current user info ────────────────────────────────────────────────
export async function getMyUserInfo(): Promise<LiferayUserInfo | null> {
  const token = await getUserToken();
  if (!token) {
    console.warn("No user token found");
    return null;
  }

  return axiosRequest<LiferayUserInfo>(
    `${BASE_URL}/o/headless-admin-user/v1.0/my-user-account`,
    token
  );
}

// ─── 5. Get products from Commerce Channel ───────────────────────────────────
export async function getProducts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  sort?: string;
} = {}): Promise<LiferayProductList> {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");
  if (!CHANNEL_ID) throw new Error("Chưa cấu hình LIFERAY_CHANNEL_ID");

  const urlParams: any = {
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 20),
    nestedFields: "skus,productSpecifications,images,categories",
    accept: "application/json"
  };

  if (params.search) urlParams.search = params.search;
  if (params.sort) urlParams.sort = params.sort;
  if (params.categoryId) {
    urlParams.filter = `categories/id eq ${params.categoryId}`;
  }

  const url = `${BASE_URL}/o/headless-commerce-delivery-catalog/v1.0/channels/${CHANNEL_ID}/products`;
  
  console.log("Product URL:", url);
  return axiosRequest<LiferayProductList>(url, token, { params: urlParams });
}

// ─── 6. Get product detail ───────────────────────────────────────────────────
export async function getProduct(productId: number): Promise<LiferayCatalogProduct> {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");
  if (!CHANNEL_ID) throw new Error("Chưa cấu hình LIFERAY_CHANNEL_ID");

  const url = `${BASE_URL}/o/headless-commerce-delivery-catalog/v1.0/channels/${CHANNEL_ID}/products/${productId}`;
  const data = await axiosRequest<LiferayCatalogProduct>(url, token, {
    params: {
      nestedFields: "skus,productSpecifications,images,categories"
    }
  });
  if (data.images) {
    data.images = data.images.map((img: any) => ({
      ...img,
      src: fixImageUrl(img.src)
    }));
  }
  return data;
}

// ─── 7. Get categories (Taxonomy) ────────────────────────────────────────────
export async function getCategories(vocabularyId?: string): Promise<{ items: LiferayCategory[] }> {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  if (vocabularyId) {
    const url = `${BASE_URL}/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${vocabularyId}/taxonomy-categories`;
    return axiosRequest<{ items: LiferayCategory[] }>(url, token, {
      params: { pageSize: 100 }
    });
  }

  const vocabsUrl = `${BASE_URL}/o/headless-admin-taxonomy/v1.0/sites/${SITE_ID}/taxonomy-vocabularies`;
  const vocabs = await axiosRequest<{ items: { id: number; name: string }[] }>(vocabsUrl, token, {
    params: { pageSize: 10 }
  });
  
  if (!vocabs.items?.length) {
    return { items: [] };
  }

  const firstVocabId = vocabs.items[0].id;
  const categoriesUrl = `${BASE_URL}/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${firstVocabId}/taxonomy-categories`;
  return axiosRequest<{ items: LiferayCategory[] }>(categoriesUrl, token, {
    params: { pageSize: 100 }
  });
}

// ─── 8. Get structured contents (courses/articles) ───────────────────────────
export async function getStructuredContents(siteId?: string, pageSize: number = 10, page: number = 1) {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  const targetSiteId = siteId ?? SITE_ID;
  const url = `${BASE_URL}/o/headless-delivery/v1.0/sites/${targetSiteId}/structured-contents`;
  
  return axiosRequest<any>(url, token, {
    params: { pageSize, page }
  });
}

// ─── 9. Get channels (Commerce Channels) ─────────────────────────────────────
export async function getChannels() {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  const url = `${BASE_URL}/o/headless-commerce-admin-catalog/v1.0/channels`;
  return axiosRequest<{ items: { id: number; name: string }[] }>(url, token, {
    params: { pageSize: 100 }
  });
}

// ─── 10. Get catalog information ─────────────────────────────────────────────
export async function getCatalogs() {
  const token = await getUserToken();
  if (!token) throw new Error("User not authenticated");

  const url = `${BASE_URL}/o/headless-commerce-admin-catalog/v1.0/catalogs`;
  return axiosRequest<{ items: { id: number; name: string }[] }>(url, token, {
    params: { pageSize: 100 }
  });
}

// ─── Shortcut helpers ────────────────────────────────────────────────────────
export async function getProductsByCategory(categoryId: number, page = 1, pageSize = 20) {
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

// ─── Cart Management ──────────────────────────────────────────────────────────
const CART_STORAGE_KEY = 'liferay_cart_id';

export async function getSavedCartId(): Promise<number | null> {
  try {
    const cartId = await AsyncStorage.getItem(CART_STORAGE_KEY);
    return cartId ? parseInt(cartId, 10) : null;
  } catch (error) {
    console.error('Error getting saved cart ID:', error);
    return null;
  }
}

async function saveCartId(cartId: number): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, String(cartId));
    console.log(`✅ Cart ID ${cartId} saved`);
  } catch (error) {
    console.error('Error saving cart ID:', error);
  }
}


// ======================== HÀM HỖ TRỢ TẠO ACCOUNT ========================
export async function ensureUserAccount(): Promise<number | null> {
  try {
    const userToken = await getUserToken();
    if (!userToken) return null;

    const userInfo = await getMyUserInfo();
    if (!userInfo) return null;

    if (userInfo.accountBriefs?.length) {
      return userInfo.accountBriefs[0].id;
    }

    const clientToken = await getClientToken();
    if (!clientToken) throw new Error("No client token");

    const createRes = await axios.post(
      `${BASE_URL}/o/headless-admin-user/v1.0/accounts`,
      {
        name: userInfo.alternateName || userInfo.emailAddress,
        type: "person",
      },
      { headers: { Authorization: `Bearer ${clientToken}` } }
    );

    const accountId = createRes.data?.id;
    if (!accountId) throw new Error("No accountId");

    console.log(`Account created: ${accountId}`);

    await axios.post(
      `${BASE_URL}/o/headless-admin-user/v1.0/accounts/${accountId}/user-accounts/by-email-address`,
      [userInfo.emailAddress],
      {
        headers: {
          Authorization: `Bearer ${clientToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return accountId;
  } catch (error: any) {
    console.error("Error in ensureUserAccount:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Tìm hoặc tạo cart cho account
 */
export async function findOrCreateCart(): Promise<number | null> {
  try {
    const token = await getUserToken();
    if (!token) return null;

    // 1. Kiểm tra cart đã lưu trong storage
    const savedCartId = await getSavedCartId();
    if (savedCartId) {
      try {
        const checkRes = await axios.get(
          `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/carts/${savedCartId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (checkRes.data?.id) {
          console.log(`✅ Dùng lại cart cũ: ${savedCartId}`);
          return savedCartId;
        }
      } catch {
        console.log(`⚠️ Cart cũ không hợp lệ, sẽ tạo mới`);
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
      }
    }

    // 2. Đảm bảo có accountId
    const accountId = await ensureUserAccount();
    if (!accountId) {
      console.error("❌ Không có accountId, không thể tạo cart");
      return null;
    }

    // 3. Tạo cart mới (đúng spec: POST /channels/{channelId}/carts)
    console.log(`🛒 Tạo cart mới cho accountId = ${accountId}, channel = ${CHANNEL_ID}`);
    const cartBody = { currencyCode: "VND", accountId, channelId: parseInt(CHANNEL_ID, 10) };
    const cartRes = await axios.post(
      `${BASE_URL}/o/headless-commerce-delivery-cart/v1.0/channels/${CHANNEL_ID}/carts`,
      cartBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const newCartId = cartRes.data?.id;
    if (!newCartId) throw new Error("Cart response missing id");

    await AsyncStorage.setItem(CART_STORAGE_KEY, String(newCartId));
    console.log(`✅ Tạo cart thành công: ${newCartId}`);
    return newCartId;
  } catch (error: any) {
    // Ghi log chi tiết để debug
    console.error("❌ findOrCreateCart thất bại:", {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      body: error.config?.data,
    });
    return null;
  }
}
