import { Radius } from "@/src/theme";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_WIDTH = SCREEN_WIDTH - 24;

interface BannerSliderProps {
  banners: string[];
}

export const BannerSlider = ({ banners }: BannerSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Tự động chuyển slide sau 3 giây (Auto-play)
  useEffect(() => {
    if (!banners || banners.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }

      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [activeIndex, banners?.length]);

  // Lắng nghe sự kiện vuốt tay để cập nhật dấu chấm trang
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CAROUSEL_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  if (!banners || banners.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CAROUSEL_WIDTH}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={styles.slideWrapper}>
            <Image
              source={{ uri: item }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}
      />

      {/* Dấu chấm chỉ số trang */}
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
    alignItems: "center",
    marginVertical: 12,
  },
  slideWrapper: {
    width: CAROUSEL_WIDTH,
    height: 160,
    paddingHorizontal: 8,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: Radius?.lg || 12,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 12,
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
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    width: 6,
  },
});

export default BannerSlider;
