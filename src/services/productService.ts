// src/services/productService.ts

import { api } from "./api";
import storeConfigService from "./storeConfigService";

export interface IProductSku {
  id: number;
  skuId: number;
  sku: string;
  price: {
    price: number;
    priceFormatted: string;
    promoPrice?: number;
    promoPriceFormatted?: string;
    finalPrice?: string;
  };
}

export interface IProductPackage {
  id: number;
  key: string;
  name: string;
  price: number;
  priceFormatted: string;
  skuId: number;
  productOptionId: number;
  selectable: boolean;
  visible: boolean;
  preselected: boolean;
}

export interface IProductOption {
  id: number;
  key: string;
  name: string;
  fieldType: string;
  required: boolean;
  skuContributor: boolean;
  values: IProductPackage[];
}

export interface IProductSpecification {
  key: string;
  label: string;
  value: string;
}

export interface IProduct {
  id: number;
  catalogName: string;
  description: string;
  name: string;
  shortDescription: string;
  productId: number;
  urlImage: string;
  slug: string;

  categories: {
    id: number;
    name: string;
  }[];

  productSpecifications: IProductSpecification[];

  skus: IProductSku[];
  firstSku?: IProductSku;

  productOptions: IProductOption[];
  packages: IProductPackage[];

  displayPrice: number;
  displayPriceFormatted: string;
  hasOptions: boolean;
}

interface ProductResponse {
  items?: any[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  lastPage?: number;
}

class ProductService {
  private normalizeUrl(url?: string): string {
    if (!url) return "";
    return url.replace("https://", "http://");
  }

  private formatPrice(value: number): string {
    return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
  }

  private getLocalizedValue(value: any): string {
    if (!value) return "";

    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }

    if (typeof value === "object") {
      return String(
        value.vi_VN ||
          value.en_US ||
          Object.values(value).find((v) => typeof v === "string") ||
          "",
      );
    }

    return "";
  }

  private mapSpecifications(item: any): IProductSpecification[] {
    return (
      item.productSpecifications
        ?.map((spec: any) => {
          const key = spec.specificationKey || spec.key || "";

          const label =
            spec.label?.vi_VN ||
            spec.label?.en_US ||
            spec.specificationTitle ||
            key;

          const value = this.getLocalizedValue(spec.value);

          return {
            key,
            label,
            value,
          };
        })
        .filter((spec: IProductSpecification) => spec.key && spec.value) ?? []
    );
  }

  private mapSku(item: any): IProductSku {
    const price = Number(item?.price?.price ?? 0);
    const promoPrice = Number(item?.price?.promoPrice ?? 0);

    return {
      id: Number(item?.id ?? 0),
      skuId: Number(item?.skuId ?? item?.id ?? 0),
      sku: item?.sku ?? "",
      price: {
        price,
        priceFormatted: item?.price?.priceFormatted ?? this.formatPrice(price),
        promoPrice,
        promoPriceFormatted:
          item?.price?.promoPriceFormatted ?? this.formatPrice(promoPrice),
        finalPrice:
          item?.price?.finalPrice ??
          this.formatPrice(promoPrice > 0 ? promoPrice : price),
      },
    };
  }

  private mapProductOptions(item: any): IProductOption[] {
    return (
      item.productOptions?.map((option: any) => {
        const values: IProductPackage[] =
          option.productOptionValues
            ?.filter((v: any) => v.visible !== false && v.selectable !== false)
            .map((v: any) => {
              const price = Number(v.price ?? 0);

              return {
                id: Number(v.id ?? 0),
                key: v.key ?? "",
                name: v.name || v.key || "Gói học",
                price,
                priceFormatted: this.formatPrice(price),
                skuId: Number(v.skuId ?? 0),
                productOptionId: Number(v.productOptionId ?? option.id ?? 0),
                selectable: v.selectable ?? true,
                visible: v.visible ?? true,
                preselected: v.preselected ?? false,
              };
            }) ?? [];

        return {
          id: Number(option.id ?? 0),
          key: option.key ?? "",
          name: option.name || option.key || "Tùy chọn",
          fieldType: option.fieldType ?? "select",
          required: option.required ?? false,
          skuContributor: option.skuContributor ?? false,
          values,
        };
      }) ?? []
    );
  }

  private mapProduct = (item: any): IProduct => {
    const productSpecifications = this.mapSpecifications(item);

    const imageUrl = item.images?.[0]?.src || item.urlImage || "";

    const skus: IProductSku[] =
      item.skus?.map((sku: any) => this.mapSku(sku)) ?? [];

    const productOptions = this.mapProductOptions(item);
    const packages = productOptions.flatMap((option) => option.values);

    const preselectedPackage =
      packages.find((pkg) => pkg.preselected) ?? packages[0];

    const skuPrice = skus[0]?.price?.promoPrice || skus[0]?.price?.price || 0;

    const displayPrice =
      preselectedPackage?.price && preselectedPackage.price > 0
        ? preselectedPackage.price
        : skuPrice;

    return {
      id: Number(item.id ?? 0),
      catalogName: item.catalogName ?? "",
      description: this.getLocalizedValue(item.description),
      name: this.getLocalizedValue(item.name) || item.name || "",
      shortDescription: this.getLocalizedValue(item.shortDescription),
      productId: Number(item.productId ?? item.id ?? 0),
      urlImage: this.normalizeUrl(imageUrl),
      slug: item.slug || item.urls?.vi_VN || item.urls?.en_US || "",

      categories:
        item.categories?.map((category: any) => ({
          id: Number(category.id ?? 0),
          name: category.name ?? "",
        })) ?? [],

      productSpecifications,

      skus,
      firstSku: skus[0],

      productOptions,
      packages,

      displayPrice,
      displayPriceFormatted: this.formatPrice(displayPrice),
      hasOptions: packages.length > 0,
    };
  };

  async getProducts(
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      categoryId?: number | string | null;
    },
  ): Promise<IProduct[]> {
    const config = await storeConfigService.getStoreConfig();

    const params: Record<string, any> = {
      page,
      pageSize,
      nestedFields:
        "productSpecifications,skus,categories,images,productOptions",
    };

    if (options?.search?.trim()) {
      params.search = options.search.trim();
    }

    if (options?.categoryId) {
      params.filter = `categoryIds/any(c:c eq '${options.categoryId}')`;
    }

    const res = await api.get<ProductResponse>(
      `/o/headless-commerce-delivery-catalog/v1.0/channels/${config.channelId}/products`,
      {
        params,
        headers: {
          "Accept-Language": "vi-VN",
        },
      },
    );

    return (res.data.items ?? []).map(this.mapProduct);
  }

  async getProductById(productId: number): Promise<IProduct> {
    const config = await storeConfigService.getStoreConfig();

    const res = await api.get<any>(
      `/o/headless-commerce-delivery-catalog/v1.0/channels/${config.channelId}/products/${productId}`,
      {
        params: {
          nestedFields:
            "productSpecifications,skus,categories,images,productOptions",
        },
        headers: {
          "Accept-Language": "vi-VN",
        },
      },
    );

    console.log("products", res.data);

    return this.mapProduct(res.data);
  }
}

export default new ProductService();
