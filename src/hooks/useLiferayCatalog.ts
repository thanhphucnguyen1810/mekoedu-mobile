// src/hooks/useLiferayCatalog.ts
import {
  getCategories,
  getProducts,
  type LiferayCatalogProduct,
  type LiferayCategory,
  type LiferayProductList,
} from '@/src/services/liferayService';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseLiferayProductsOptions {
  pageSize?: number;
  initialCategoryId?: number;
  initialSearch?: string;
}

interface UseLiferayProductsReturn {
  products: LiferayCatalogProduct[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  applyFilters: (filters: { search?: string; categoryId?: number }) => void;
  refetch: () => Promise<void>;
}

export function useLiferayProducts(
  options: UseLiferayProductsOptions = {}
): UseLiferayProductsReturn {
  const { pageSize = 10, initialCategoryId, initialSearch = '' } = options;
  
  const [products, setProducts] = useState<LiferayCatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const fetchProducts = useCallback(
    async (page: number, isLoadMore = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      
      if (!isLoadMore) {
        setLoading(true);
      }
      
      try {
        const params: any = {
          page,
          pageSize,
        };
        
        if (search) {
          params.search = search;
        }
        
        if (categoryId) {
          params.categoryId = categoryId;
        }
        
        console.log('Fetching products with params:', params);
        const data: LiferayProductList = await getProducts(params);
        
        const newProducts = data.items || [];
        const totalCount = data.totalCount || 0;
        
        if (isLoadMore) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        const more = newProducts.length === pageSize && products.length + newProducts.length < totalCount;
        setHasMore(more);
        hasMoreRef.current = more;
        setCurrentPage(page);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Không thể tải danh sách sản phẩm');
      } finally {
        isLoadingRef.current = false;
        if (!isLoadMore) {
          setLoading(false);
        }
      }
    },
    [search, categoryId, pageSize]
  );

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingRef.current) return;
    await fetchProducts(currentPage + 1, true);
  }, [currentPage, fetchProducts]);

  const applyFilters = useCallback(
    (filters: { search?: string; categoryId?: number }) => {
      if (filters.search !== undefined) setSearch(filters.search);
      if (filters.categoryId !== undefined) setCategoryId(filters.categoryId);
      setCurrentPage(1);
      setProducts([]);
      setHasMore(true);
      hasMoreRef.current = true;
    },
    []
  );

  const refetch = useCallback(async () => {
    setCurrentPage(1);
    setProducts([]);
    setHasMore(true);
    hasMoreRef.current = true;
    await fetchProducts(1, false);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts(1, false);
  }, [search, categoryId]);

  return {
    products,
    loading,
    error,
    hasMore,
    loadMore,
    applyFilters,
    refetch,
  };
}

interface UseLiferayCategoriesReturn {
  categories: LiferayCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLiferayCategories(): UseLiferayCategoriesReturn {
  const [categories, setCategories] = useState<LiferayCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data.items || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    refetch,
  };
}
