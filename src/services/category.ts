import { api } from "./api";

export interface ICategory {
  id: number;
  name: string;
  numberOfTaxonomyCategories?: number;
  description?: string;
}

// 1. Lấy danh sách category cấp 1
export const getCategoriesApi = async (): Promise<ICategory[]> => {
  const res = await api.get(
    "/headless-admin-taxonomy/v1.0/taxonomy-vocabularies/41100/taxonomy-categories",
  );

  return res.data.items;
};

// 2. Lấy danh mục con theo categoryId
export const getSubCategoriesApi = async (
  categoryId: number,
): Promise<ICategory[]> => {
  const res = await api.get(
    `/headless-admin-taxonomy/v1.0/taxonomy-categories/${categoryId}/taxonomy-categories`,
  );

  return res.data.items;
};
