import { Radius, Spacing } from "@/src/theme";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ROOT_PADDING = 8; 

const AVAILABLE_WIDTH = SCREEN_WIDTH - (ROOT_PADDING * 2);

const VISUAL_PAD = Spacing.layout.screenHorizontal - ROOT_PADDING; 

const CAROUSEL_WIDTH = AVAILABLE_WIDTH - (VISUAL_PAD * 2);

interface BannerSliderProps {
  banners: string[];
}

export const BannerSlider = ({ banners }: BannerSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeIndex, banners?.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / CAROUSEL_WIDTH
    );
    if (index !== activeIndex) setActiveIndex(index);
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled // Bật lại tính năng khóa trang chuẩn của React Native
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={styles.slideWrapper}>
            <Image
              source={item}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}
      />

      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                activeIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
    // Ép khoảng đệm cho container để giới hạn FlatList nằm gọn gàng phía trong
    paddingHorizontal: VISUAL_PAD,
    position: "relative",
  },
  slideWrapper: {
    width: CAROUSEL_WIDTH,
    height: 160,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.lg,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: Spacing[2],
    alignSelf: "center",
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#FFFFFF",
    width: 14,
  },
  inactiveDot: {
    backgroundColor: "rgba(255,255,255,0.45)",
    width: 6,
  },
});

export default BannerSlider;
