import { BannerSlider } from "@/src/components/BannerSlider";
import { CategoryGrid, Category } from "@/src/components/CategoryGrid";
import { AppText } from "@/src/components/common";
import { ProductCard } from "@/src/components/ProductCard";
import { useTheme } from "@/src/theme";
import { ScrollView, StyleSheet, View } from "react-native";

const HOME_DATA = {
  // BannerSlider nhận mảng string[] (URL hình ảnh)
  banners: [
    'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg',
    'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg',
  ],

  // CategoryGrid nhận mảng Category[]
  categories: [
    { id: 'all', name: 'Tất cả', iconName: 'apps' },
    { id: 'prog', name: 'Lập trình', iconName: 'laptop' },
    { id: 'lang', name: 'Ngoại ngữ', iconName: 'earth' },
    { id: 'sci', name: 'Khoa học', iconName: 'cog-outline' },
    { id: 'design', name: 'Thiết kế', iconName: 'vector-square' },
    { id: 'design', name: 'Thiết kế', iconName: 'vector-square' },
    { id: 'design', name: 'Thiết kế', iconName: 'vector-square' },
    { id: 'design', name: 'Thiết kế', iconName: 'vector-square' },
    { id: 'more', name: '...', iconName: 'dots-horizontal' },
  ] satisfies Category[],

  // ProductCard nhận object product
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
      imageUrl: 'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg' 
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
      imageUrl: 'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg' 
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
      imageUrl: 'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg' 
    }
  ]
};


export default function HomeScreen() {
  const { c, spacing } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
    
    <ScrollView style={{ backgroundColor: c.bg, flex: 1 }}>
      {/* 1. Banner Slider */}
      <BannerSlider data={HOME_DATA.banners} />

      {/* 2. Category Grid */}
      <View style={{ padding: spacing.layout.screenHorizontal }}>
        <CategoryGrid 
          data={HOME_DATA.categories} 
          onCategoryPress={(id) => {
            const selectedCategory = HOME_DATA.categories.find(c => c.id === id);
            console.log(selectedCategory?.name);
          }} 
        />
      </View>

      {/* 3. Product Cards List */}
      <View style={{ padding: spacing.layout.screenHorizontal }}>
        <AppText variant="h3" style={{ marginBottom: spacing.md }}>Khóa học nổi bật</AppText>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.layout.gridGap }}>
          {HOME_DATA.products.map(item => (
            <ProductCard 
              key={item.id} 
              brandName={item.brandName}
              brandLogoChar={item.brandLogoChar}
              title={item.title}
              price={item.price}
              duration={item.duration}
              lessonCount={item.lessonCount}
              rating={item.rating}
              reviewCount={item.reviewCount}
              imageUrl={item.imageUrl} 
              onPress={() => alert(`Xem chi tiết: ${item.title}`)}
              onAddToCartPress={() => alert(`Đã thêm ${item.title} vào giỏ hàng!`)}
              onBuyCoursePress={() => alert('Chuyển sang trang thanh toán...')}
            />
          ))}
        </View>
      </View>

    </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

