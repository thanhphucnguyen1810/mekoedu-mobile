import { ENV } from "../types/env";
import { api } from "./api";

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

  productSpecifications: {
    author?: string;
    courseDuration?: string;
    [key: string]: string | undefined;
  };

  skus: {
    price: {
      price: number;
      priceFormatted: string;
      promoPrice?: number;
      promoPriceFormatted?: string;
      finalPrice?: string;
    };
  };
}

interface ProductResponse {
  items: any[];
  totalCount: number;
  page: number;
  pageSize: number;
  lastPage: number;
}

class ProductService {
  private normalizeUrl(url?: string): string {
    if (!url) return "";

    return url.replace("https://", "http://");
  }

  private mapProduct(item: any): IProduct {
    const specs =
      item.productSpecifications?.reduce(
        (acc: Record<string, string>, spec: any) => {
          acc[spec.specificationKey] = spec.value;
          return acc;
        },
        {},
      ) ?? {};

    const imageUrl = item.images?.[0]?.src || item.urlImage || "";

    return {
      id: item.id,
      catalogName: item.catalogName ?? "",
      description: item.description ?? "",
      name: item.name ?? "",
      shortDescription: item.shortDescription ?? "",
      productId: item.productId,
      urlImage: this.normalizeUrl(imageUrl),
      slug: item.slug ?? "",

      categories:
        item.categories?.map((category: any) => ({
          id: category.id,
          name: category.name,
        })) ?? [],

      productSpecifications: {
        author: specs.author,
        courseDuration: specs.courseduration,
        ...specs,
      },

      skus: {
        price: {
          price: item.skus?.[0]?.price?.price ?? 0,
          priceFormatted: item.skus?.[0]?.price?.priceFormatted ?? "$ 0.00",
          promoPrice: item.skus?.[0]?.price?.promoPrice ?? 0,
          promoPriceFormatted:
            item.skus?.[0]?.price?.promoPriceFormatted ?? "$ 0.00",
          finalPrice: item.skus?.[0]?.price?.finalPrice ?? "$ 0.00",
        },
      },
    };
  }

  async getProducts(
    page = 1,
    pageSize = 20,
    options?: {
      search?: string;
      categoryId?: number | string | null;
    },
  ): Promise<IProduct[]> {
    const params: any = {
      page,
      pageSize,
      nestedFields: "productSpecifications,skus,categories,images",
    };

    if (options?.search?.trim()) {
      params.search = options.search.trim();
    }
    if (options?.categoryId) {
      params.filter = `categoryIds/any(c:c eq '${options.categoryId}')`;
    }

    const res = await api.get<ProductResponse>(
      `/o/headless-commerce-delivery-catalog/v1.0/channels/${ENV.CHANNEL_ID}/products`,
      { params },
    );

    return (res.data.items ?? []).map((item) => this.mapProduct(item));
  }
  async getProductById(productId: number): Promise<IProduct> {
    const res = await api.get<any>(
      `/o/headless-commerce-delivery-catalog/v1.0/products/${productId}`,
      {
        params: {
          nestedFields: "productSpecifications,skus,categories,images",
        },
      },
    );

    return this.mapProduct(res.data);
  }
}

export default new ProductService();
