import { Category, CategoryGrid } from "../CategoryGrid";
import { BannerSlider } from "./BannerSlider";
import { FeaturedCoursesList } from "./FeaturedCoursesList";
import { AppConfig } from '@/src/config/appConfig';

// Lấy banners từ config
const bannerImages = AppConfig.home.banners.images;

// ĐỒNG BỘ ĐẦU VÀO CẤU HÌNH DÀNH CHO HOMEPAGE ĐỘNG:
export const DYNAMIC_HOME_CONFIG = {
  sections: [
    {
      id: "section-banners",
      type: "BANNER_SLIDER",
      visible: true,
      order: 1,
      props: {
        banners: bannerImages,
      }
    },
    {
      id: "section-categories",
      type: "CATEGORY_GRID",
      visible: true,
      order: 2,
      props: {
        showAllOption: true,  
      }
    },
    {
      id: "section-featured-products",
      type: "FEATURED_COURSES",
      visible: true,
      order: 3,
      props: {
        title: AppConfig.home.sections.featuredTitle,
      }
    }
  ]
};

export const HomeComponentsMap: Record<string, React.ComponentType<any>> = {
  BANNER_SLIDER: BannerSlider,
  CATEGORY_GRID: CategoryGrid,
  FEATURED_COURSES: FeaturedCoursesList
};
