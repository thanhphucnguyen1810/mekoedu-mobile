import React from 'react';
import { FlatList, StyleSheet, Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { Spacing, Radius, C } from '@/src/theme';

const { width } = Dimensions.get('window');

interface BannerSliderProps {
  data: string[]; // Mảng chứa URL hình ảnh
}

export const BannerSlider = ({ data }: BannerSliderProps) => {
  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled // Lướt dính từng trang
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          gap: Spacing.md, // Khoảng cách giữa 2 banner
          paddingHorizontal: Spacing.layout.screenHorizontal 
        }}
        renderItem={({ item }) => (
          <Image 
            source={{ uri: item }} 
            style={styles.banner}
            contentFit="cover"
            transition={300}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    // Rộng bằng màn hình trừ đi 2 bên mép
    width: width - (Spacing.layout.screenHorizontal * 2), 
    height: 160,
    borderRadius: Radius.xl, // Bo góc lớn 16px cho banner
    backgroundColor: C.bgSoft,
  }
});
