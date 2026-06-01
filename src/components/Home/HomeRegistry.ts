import { Category, CategoryGrid } from "../CategoryGrid";
import { BannerSlider } from "./BannerSlider";
import { FeaturedCoursesList } from "./FeaturedCoursesList";

export const HOME_DATA = {
  banners: [
    'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg',
    'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_5_dcca1e6fa8.jpg',
    'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_20_9322b13411.jpg',
    'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg'
  ],

  categories: [
    { id: 'all', name: 'Tất cả', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'prog', name: 'Lập trình', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'lang', name: 'Ngoại ngữ', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'sci', name: 'Khoa học', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'design', name: 'Thiết kế', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'design_1', name: 'Thiết kế', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' }, 
  { id: 'design_2', name: 'Thiết kế', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'design_3', name: 'Thiết kế', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  { id: 'more', name: '...', imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_22_05747dec46.jpg' },
  ] as Category[],

  products: [
    { 
      id: '1', 
      brandName: 'Mekosoft',
      brandLogoChar: 'M',
      title: 'Khóa học lập trình ReactJS cơ bản cho người mới bắt đầu.', 
      price: 2000000, 
      duration: '28 giờ',
      lessonCount: 60,
      rating: 5,
      reviewCount: 3000,
      imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_5_dcca1e6fa8.jpg' 
    },
    { 
      id: '2', 
      brandName: 'Mekosoft',
      brandLogoChar: 'M',
      title: 'Khóa học Node.js và MongoDB nâng cao', 
      price: 1500000, 
      duration: '35 giờ',
      lessonCount: 82,
      rating: 4.8,
      reviewCount: 1250,
      imageUrl: 'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg' 
    },
    { 
      id: '3', 
      brandName: 'Mekosoft',
      brandLogoChar: 'M',
      title: 'Khóa học Node.js và MongoDB nâng cao', 
      price: 1500000, 
      duration: '35 giờ',
      lessonCount: 82,
      rating: 4.8,
      reviewCount: 1250,
      imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_20_9322b13411.jpg' 
    },
    { 
      id: '4', 
      brandName: 'Mekosoft',
      brandLogoChar: 'M',
      title: 'Khóa học Node.js và MongoDB nâng cao', 
      price: 1500000, 
      duration: '35 giờ',
      lessonCount: 82,
      rating: 4.8,
      reviewCount: 1250,
      imageUrl: 'https://cdn2.fptshop.com.vn/unsafe/800x0/Anh_meo_cute_20_9322b13411.jpg' 
    }
  ]
};

// ĐỒNG BỘ ĐẦU VÀO CẤU HÌNH DÀNH CHO HOMEPAGE ĐỘNG:
export const DYNAMIC_HOME_CONFIG = {
  sections: [
    {
      id: "section-banners",
      type: "BANNER_SLIDER",
      visible: true,
      order: 1,
      props: {
        banners: HOME_DATA.banners
      }
    },
    {
      id: "section-categories",
      type: "CATEGORY_GRID",
      visible: true,
      order: 2,
      props: {
        categories: HOME_DATA.categories
      }
    },
    {
      id: "section-featured-products",
      type: "FEATURED_COURSES",
      visible: true,
      order: 3,
      props: {
        title: "Khóa học nổi bật",
        courses: HOME_DATA.products
      }
    }
  ]
};

export const HomeComponentsMap: Record<string, React.ComponentType<any>> = {
  BANNER_SLIDER: BannerSlider,
  CATEGORY_GRID: CategoryGrid,
  FEATURED_COURSES: FeaturedCoursesList
};
