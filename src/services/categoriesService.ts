import { ENV } from "../types/env";
import { api } from "./api";

interface ICategory {
  id: number;
  name: string;
}

interface TaxonomyCategoryResponse {
  items: ICategory[];
}

class Categories {
  async getCategories(): Promise<ICategory[]> {
    try {
      const res = await api.get<TaxonomyCategoryResponse>(
        `/o/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/${ENV.VOCABULARY_ID}/taxonomy-categories?fields=id,name&pageSize=100`,
      );

      return res.data.items ?? [];
    } catch (e) {
      console.log("Error fetching categories", e);
      throw e;
    }
  }
  async getCategoriesChild(
    parentTaxonomyCategoryId: number,
  ): Promise<ICategory[]> {
    try {
      const res = await api.get<TaxonomyCategoryResponse>(
        `/o/headless-admin-taxonomy/v1.0/taxonomy-categories/${parentTaxonomyCategoryId}/taxonomy-categories?fields=id,name&pageSize=100`,
      );

      return res.data.items ?? [];
    } catch (e) {
      console.log("Error fetching categories", e);
      throw e;
    }
  }
}

export default new Categories();
