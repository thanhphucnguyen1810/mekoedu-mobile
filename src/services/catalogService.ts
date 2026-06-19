/**
 * src/services/liferay/catalogService.ts
 */

import { ENV } from "../config/env";
import { http } from "../config/httpClient";
import type {
  CatalogProduct,
  Category,
  ProductList,
  ProductQueryParams,
} from "../types/liferay";
import { normalizeImages, toAbsoluteUrl } from "../utils/url";

const NESTED = "skus,productSpecifications,images,categories";

function normalizeProduct(product: CatalogProduct): CatalogProduct {
  return {
    ...product,
    thumbnail: toAbsoluteUrl(product.thumbnail),
    images: normalizeImages(product.images as any),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map sort option string sang format Liferay chấp nhận.
 * Liferay Commerce dùng field name chuẩn OData, không phải camelCase tuỳ ý.
 */
function mapSortParam(sort?: string): string | undefined {
  switch (sort) {
    case 'price_asc':   return 'price:asc';
    case 'price_desc':  return 'price:desc';
    case 'newest':      return 'createDate:desc';
    case 'popular':     return undefined; // default của Liferay, không cần sort param
    default:            return sort || undefined;
  }
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(params: ProductQueryParams = {}): Promise<ProductList> {
  const { page = 1, pageSize = 20, search, categoryId, sort } = params;

  const query: Record<string, string> = {
    page: String(page),
    pageSize: String(pageSize),
    nestedFields: NESTED,
  };

  if (search?.trim()) query.search = search.trim();

  // Liferay OData filter – dùng taxonomy categories
  if (categoryId) {
    query.filter = `categoryIds/any(c:c eq '${Number(categoryId)}')`;
  }

  const mapped = mapSortParam(sort);
  if (mapped) query.sort = mapped;

  const res = await http.get<ProductList>(
    `/o/headless-commerce-delivery-catalog/v1.0/channels/${ENV.CHANNEL_ID}/products`,
    { params: query }
  );

  return {
    ...res.data,
    items: (res.data.items ?? []).map(normalizeProduct),
  };
}

export async function getProduct(productId: number): Promise<CatalogProduct> {
  const res = await http.get<CatalogProduct>(
    `/o/headless-commerce-delivery-catalog/v1.0/channels/${ENV.CHANNEL_ID}/products/${productId}`,
    { params: { nestedFields: NESTED } }
  );
  return normalizeProduct(res.data);
}

export async function searchProducts(
  keyword: string,
  page = 1,
  pageSize = 20
): Promise<ProductList> {
  return getProducts({ search: keyword, page, pageSize });
}

/**
 * Lấy sản phẩm theo category / sub-category.
 *
 * FIX: trước đây `page` không được truyền vào query → Liferay trả 400 khi page > 1.
 * Sort dùng `mapSortParam` để đúng format OData.
 */
export async function getProductsByCategory(
  categoryId: number,
  page = 1,
  pageSize = 20,
  subCategoryId?: number,
  sort?: string
): Promise<ProductList> {
  const filterCategoryId = subCategoryId ?? categoryId;

  const query: Record<string, string> = {
    page: String(page),       
    pageSize: String(pageSize),
    nestedFields: NESTED,
    filter: `categoryIds/any(c:c eq '${filterCategoryId}')`,
  };

  const mapped = mapSortParam(sort);
  if (mapped) query.sort = mapped;

   try {
    const res = await http.get<ProductList>(
      `/o/headless-commerce-delivery-catalog/v1.0/channels/${ENV.CHANNEL_ID}/products`,
      { params: query }
    );

    return {
      ...res.data,
      items: (res.data.items ?? []).map(normalizeProduct),
    };

  } catch (error: any) {
    throw error;
  }
}

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * Lấy category cấp 1 từ vocabulary.
 *
 * Liferay trả về field `image` (object) chứ không phải `imageUrl` (string),
 * nên cần normalize về dạng CategoryGrid dùng được.
 *
 * Cấu trúc thực tế từ API:
 *   { id, name, numberOfTaxonomyCategories, image?: { contentUrl } }
 *
 * CategoryGrid cần: { id: string, name: string, imageUrl: string }
 */
export async function getCategories(vocabularyId?: string): Promise<Category[]> {
  const configuredVocabId = vocabularyId ?? ENV.VOCABULARY_ID;
  let rawItems: any[] = [];

  // 1. Thử dùng vocabulary đã cấu hình (nếu có)
  if (configuredVocabId) {
    try {
      const res = await http.get<{ items: any[] }>(
        `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${configuredVocabId}/taxonomy-categories`,
        {
          params: {
            pageSize: 100,
            fields: 'id,name,description,numberOfTaxonomyCategories,image',
          },
        }
      );
      rawItems = res.data.items ?? [];

    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`Vocabulary ${configuredVocabId} không tồn tại hoặc không có quyền (404), chuyển sang fallback...`);
      } else {
        throw error;
      }
    }
  }

  // 2. Fallback: lấy vocabulary đầu tiên của site (nếu chưa có dữ liệu)
  if (rawItems.length === 0) {
    const vocabsRes = await http.get<{ items: { id: number; name: string }[] }>(
      `/o/headless-admin-taxonomy/v1.0/sites/${ENV.SITE_ID}/taxonomy-vocabularies`,
      { params: { pageSize: 10 } }
    );
    const firstVocab = vocabsRes.data.items?.[0];
    if (!firstVocab) {
      return [];
    }
    const catRes = await http.get<{ items: any[] }>(
      `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${firstVocab.id}/taxonomy-categories`,
      { params: { pageSize: 100, fields: 'id,name,numberOfTaxonomyCategories,image' } }
    );
    rawItems = catRes.data.items ?? [];
  }

  const normalized = rawItems.map(normalizeCategory);
  return normalized;
}

/** Lấy category con (cấp 2) của 1 category cha */
export async function getSubCategories(parentCategoryId: number): Promise<Category[]> {
  const res = await http.get<{ items: any[] }>(
    `/o/headless-admin-taxonomy/v1.0/taxonomy-categories/${parentCategoryId}/taxonomy-categories`,
    {
      params: {
        pageSize: 100,
        fields: 'id,name,numberOfTaxonomyCategories,image',
      },
    }
  );
  return (res.data.items ?? []).map(normalizeCategory);
}

/**
 * Normalize 1 raw category object từ Liferay về shape mà app dùng.
 * Liferay trả `image.contentUrl` hoặc `image.url` tuỳ version.
 */
function normalizeCategory(raw: any): Category {
  let imageUrl = raw.image?.contentUrl ?? raw.image?.url ?? raw.imageUrl ?? '';

  // Nếu chưa có imageUrl và có description, trích xuất src từ thẻ img
  if (!imageUrl && raw.description) {
    const matches = raw.description.match(/<img[^>]+src=["']([^"']+)["']/gi);
    if (matches && matches.length > 0) {
      // Lấy src của thẻ đầu tiên
      const srcMatch = matches[0].match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) {
        imageUrl = srcMatch[1];
      }
    }
  }

  // Chuyển relative -> absolute
  imageUrl = toAbsoluteUrl(imageUrl) ?? '';

  return {
    id: Number(raw.id),
    name: raw.name ?? '',
    description: raw.description ?? '',
    imageUrl,
    numberOfTaxonomyCategories: raw.numberOfTaxonomyCategories ?? 0,
  };
}

