import CategoryGrid from "../CategoryGrid";
import { BannerSlider } from "./BannerSlider";
import { FeaturedCoursesList } from "./FeaturedCoursesList";

export const HOME_DATA = {
  banners: [
    "https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg",
    "https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_5_dcca1e6fa8.jpg",
    "https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_20_9322b13411.jpg",
    "https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg",
  ],
};

export const DYNAMIC_HOME_CONFIG = {
  sections: [
    {
      id: "banner-slider",
      type: "BANNER_SLIDER",
      visible: true,
      order: 1,
      props: {
        banners: HOME_DATA.banners,
      },
    },
    {
      id: "category-grid",
      type: "CATEGORY_GRID",
      visible: true,
      order: 2,
      props: {},
    },
    {
      id: "featured-courses",
      type: "FEATURED_COURSES",
      visible: true,
      order: 3,
      props: {
        title: "Khóa học nổi bật",
        limit: 5,
      },
    },
  ],
};

export const HomeComponentsMap: Record<string, React.ComponentType<any>> = {
  BANNER_SLIDER: BannerSlider,
  CATEGORY_GRID: CategoryGrid,
  FEATURED_COURSES: FeaturedCoursesList,
};
