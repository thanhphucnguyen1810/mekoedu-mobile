/**
 * src/types/liferay.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Tất cả TypeScript interface / type liên quan đến Liferay API.
 * Mỗi service chỉ import type từ đây, không tự khai báo lại.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterPayload {
  emailAddress: string;
  password: string;
  givenName: string;
  familyName: string;
  screenName?: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserInfo {
  id: number;
  emailAddress: string;
  givenName: string;
  familyName: string;
  alternateName: string;
  accountBriefs?: { id: number; name: string; externalReferenceCode?: string }[];
  roleBriefs?: { id: number; name: string }[];
}

// ─── Catalog / Product ────────────────────────────────────────────────────────

export interface ProductImage {
  id: number;
  /** URL đã được normalize (absolute) */
  src: string;
  url?: string;
}

export interface ProductSku {
  price: number;
  promoPrice: number;
  sku: string;
}

export interface ProductSpecification {
  specificationKey: string;
  specificationTitle?: string;
  value: string;
}

export interface CatalogProduct {
  id: number;
  productId?: number;
  name: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  price?: number;
  promoPrice?: number;
  catalogName?: string;
  categories?: Category[];
  productSpecifications?: ProductSpecification[];
  skus?: ProductSku[];
  images?: ProductImage[];
  createDate?: string;
  modifiedDate?: string;
}

export interface ProductList {
  items: CatalogProduct[];
  page: number;
  pageSize: number;
  totalCount: number;
  lastPage: number;
}

export interface ProductQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: number;
  sort?: string;
}

// ─── Category ─────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  parentCategoryId?: number;
  numberOfTaxonomyCategories?: number;
  description?: string;
  imageUrl: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  productId: number;
  skuId: number;
  quantity: number;
  name: string;
  price: number;
  promoPrice?: number;
  thumbnail?: string;
  catalogName?: string;
}

export interface Cart {
  id: number;
  accountId: number;
  channelId: number;
  cartItems: CartItem[];
  total: number;
  subtotal: number;
  discountTotal?: number;
}

export interface AddToCartPayload {
  skuId: number;
  quantity?: number;
}
