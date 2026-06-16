import CategoryGrid from "../CategoryGrid";
import { BannerSlider } from "./BannerSlider";
import { FeaturedCoursesList } from "./FeaturedCoursesList";

export const HOME_DATA = {
  banners: [
    "http://192.168.1.216:8080/documents/20117/0/Gemini_Generated_Image_vl3d8svl3d8svl3d.png/bb4ddc81-0b3c-ad10-0a68-eea19ab97676?version=1.0&t=1781153697038",
    "http://192.168.1.216:8080/documents/20117/0/Gemini_Generated_Image_vl3d8svl3d8svl3d.png/bb4ddc81-0b3c-ad10-0a68-eea19ab97676?version=1.0&t=1781153697038",
    "http://192.168.1.216:8080/documents/20117/0/Gemini_Generated_Image_vl3d8svl3d8svl3d.png/bb4ddc81-0b3c-ad10-0a68-eea19ab97676?version=1.0&t=1781153697038",
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
