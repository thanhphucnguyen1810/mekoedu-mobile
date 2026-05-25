import { AppHeader, AppText } from '@/src/components/common';
import { ProductCard } from '@/src/components/ProductCard';
import { useTheme } from '@/src/theme';
import React from 'react';
import { ScrollView, StyleSheet, View } from "react-native";

const HOME_DATA = {
  // BannerSlider nhận mảng string[] (URL hình ảnh)
  banners: [
    'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg',
    'https://www.robins.vn/wp-content/uploads/2026/01/hinh-anh-con-meo-cute-1.jpg.jpg',
  ],

  // CategoryGrid nhận mảng Category[]
  categories: [
    { id: '1', name: 'Toán', icon: 'math-icon' },
    { id: '2', name: 'Lý', icon: 'phys-icon' },
    { id: '3', name: 'Hóa', icon: 'chem-icon' },
    { id: '4', name: 'Anh', icon: 'eng-icon' }
  ],

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
    }
  ]
};

export default function CoursesScreen() {
  // lấy tất cả biến từ Theme
  const { c, spacing, typography } = useTheme()

  return (
    <ScrollView style={{ backgroundColor: c.bg, flex: 1 }}>
    
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <AppHeader title="Khóa học" />
      <View style={{ padding: spacing.layout.screenHorizontal }}>
        <AppText style={{ color: c.text, ...typography.variants.h3 }}>
          Danh sách khóa học
        </AppText>

        {/* 3. Product Cards List */}
        <View style={{ padding: spacing.layout.screenHorizontal }}>                
                {/* Thêm flexDirection: 'row' và flexWrap: 'wrap' nếu bạn muốn hiển thị dạng Grid 2 cột */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.layout.gridGap }}>
                  {HOME_DATA.products.map(item => (
                    <ProductCard 
                      key={item.id} 
                      
                      // Truyền dữ liệu hiển thị
                      brandName={item.brandName}
                      brandLogoChar={item.brandLogoChar}
                      title={item.title}
                      price={item.price}
                      duration={item.duration}
                      lessonCount={item.lessonCount}
                      rating={item.rating}
                      reviewCount={item.reviewCount}
                      
                      // Truyền ảnh từ data thay vì hardcode một link
                      imageUrl={item.imageUrl} 
                      
                      // Truyền các sự kiện tương tác
                      onPress={() => alert(`Xem chi tiết: ${item.title}`)}
                      onAddToCartPress={() => alert(`Đã thêm ${item.title} vào giỏ hàng!`)}
                      onBuyCoursePress={() => alert('Chuyển sang trang thanh toán...')}
                    />
                  ))}
                </View>
              </View>

      </View>
    </View>

    </ ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
})

