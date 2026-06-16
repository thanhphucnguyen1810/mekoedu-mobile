import { api } from "./api";
import storeConfigService from "./storeConfigService";

export interface ICategoryProperties {
  key: string;
  value: string;
}

export interface ICategory {
  id: number;
  name: string;
  taxonomyCategoryProperties?: ICategoryProperties[];
  icon?: string;
}

export interface TaxonomyCategoryResponse {
  items?: ICategory[];
}

class Categories {
  private mapCategoryIcon(category: ICategory): ICategory {
    const icon = category.taxonomyCategoryProperties?.find(
      (property) => property.key === "icon",
    )?.value;

    return {
      ...category,
      icon: icon ?? "",
    };
  }

  async getCategories(): Promise<ICategory[]> {
    try {
      const config = await storeConfigService.getStoreConfig();

      const res = await api.get<TaxonomyCategoryResponse>(
        `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${config.vocabularyId}/taxonomy-categories`,
        {
          params: {
            fields: "id,name,taxonomyCategoryProperties",
            pageSize: 100,
          },
        },
      );

      return (res.data.items ?? []).map(this.mapCategoryIcon);
    } catch (error) {
      console.log("Error fetching categories", error);
      throw error;
    }
  }

  async getCategoriesChild(
    parentTaxonomyCategoryId: number,
  ): Promise<ICategory[]> {
    try {
      const res = await api.get<TaxonomyCategoryResponse>(
        `/o/headless-admin-taxonomy/v1.0/taxonomy-categories/${parentTaxonomyCategoryId}/taxonomy-categories`,
        {
          params: {
            fields: "id,name,taxonomyCategoryProperties",
            pageSize: 100,
          },
        },
      );

      return (res.data.items ?? []).map(this.mapCategoryIcon);
    } catch (error) {
      console.log("Error fetching child categories", error);
      throw error;
    }
  }
}

export default new Categories();
