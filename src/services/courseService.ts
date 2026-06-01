// src/services/courseService.ts
// Lấy courses từ Liferay Commerce Channel (products) thay vì structured-contents
// vì structured-contents trả 404 với site này.

import { getProduct, getProducts, type LiferayCatalogProduct, type LiferayProductList } from './liferayService';

class CourseService {

  async getCourses(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    categoryId?: number;
    sort?: string;
  } = {}): Promise<LiferayProductList> {
    try {
      console.log('📚 Fetching courses (via C`ommerce products)');
      const response = await getProducts(params);
      console.log(`✅ Loaded ${response.items?.length || 0} courses`);
      return response;
    } catch (error) {
      console.error('❌ Error loading courses:', error);
      return { items: [], totalCount: 0, page: 1, pageSize: params.pageSize ?? 10, lastPage: 1 };
    }
  }

  async getCourseById(productId: number): Promise<LiferayCatalogProduct | null> {
    try {
      return await getProduct(productId);
    } catch (error) {
      console.error(`Error loading course ${productId}:`, error);
      return null;
    }
  }
}

export const courseService = new CourseService();
export type { LiferayCatalogProduct as Course, LiferayProductList as CourseList };

