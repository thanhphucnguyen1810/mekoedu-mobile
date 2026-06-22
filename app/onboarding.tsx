import {
  AppButton,
  AppDivider,
  AppText,
} from '@/src/components/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing, Typography } from '@/src/theme';

interface Slide {
  id: string
  title: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
  color: string
}

const slides: Slide[] = [
  {
    id: '01',
    title: 'Khám phá thế giới mua sắm',
    description:
      'Truy cập hàng ngàn sản phẩm chất lượng từ các thương hiệu hàng đầu. Mua sắm dễ dàng chỉ với một chạm.',
    icon: 'bag-handle', // Hoặc 'cart' tùy icon set của má nha
    color: Colors.info,
  },
  {
    id: '02',
    title: 'Thanh toán an toàn, bảo mật',
    description:
      'Trải nghiệm hệ thống thanh toán siêu tốc với công nghệ bảo mật thông minh. Bảo vệ quyền lợi mua sắm của bạn.',
    icon: 'shield-checkmark',
    color: Colors.primary[500],
  },
  {
    id: '03',
    title: 'Ưu đãi ngập tràn, ship liền tay',
    description:
      'Nhận ngay voucher độc quyền và miễn phí vận chuyển mỗi ngày. Theo dõi đơn hàng dễ dàng, giao hàng nhanh chóng.',
    icon: 'gift', // Hoặc 'paper-plane', 'truck' nè
    color: Colors.accent[500],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Tỉ lệ responsive
  const scale = useMemo(() => Math.min(screenWidth / 390, 1.3), [screenWidth]);

  // Kích thước linh hoạt theo màn hình
  const iconSize = Math.min(150 * scale, screenWidth * 0.4);
  const titleFontSize = Math.min(24 * scale, 32);
  const descFontSize = Math.min(16 * scale, 20);
  const dotSize = 10;
  const activeDotWidth = 28;

  // Tự động chuyển slide
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % slides.length;
        scrollViewRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Hiệu ứng khi đổi slide
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset scale for next animation
      scaleAnim.setValue(0.8);
    });
  }, [activeIndex]);

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      router.push('/welcome');
    } else {
      const nextIndex = activeIndex + 1;
      scrollViewRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    router.push('/welcome');
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    setActiveIndex(index);
  };

  const currentSlide = slides[activeIndex];
  const progress = ((activeIndex + 1) / slides.length) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${progress}%`,
              backgroundColor: currentSlide.color,
            },
          ]}
        />
      </View>

      {/* Carousel */}
      <FlatList
        ref={scrollViewRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        style={styles.flatList}
        onMomentumScrollEnd={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x;
          const currentIndex = Math.round(contentOffsetX / screenWidth);
          if (currentIndex !== activeIndex) {
            setActiveIndex(currentIndex);
            fadeAnim.setValue(0);
          }
        }}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, { width: screenWidth }]}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  width: iconSize,
                  height: iconSize,
                  borderRadius: iconSize / 2,
                  backgroundColor: item.color,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Ionicons name={item.icon} size={iconSize * 0.45} color="#fff" />
              <View
                style={[
                  styles.badge,
                  {
                    width: iconSize * 0.3,
                    height: iconSize * 0.3,
                    borderRadius: iconSize * 0.15,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.badgeText,
                    {
                      fontSize: iconSize * 0.14,
                      color: item.color,
                    },
                  ]}
                >
                  {item.id}
                </AppText>
              </View>
            </Animated.View>

            <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
              <AppText
                variant="h2"
                align="center"
                style={[styles.title, { fontSize: titleFontSize }]}
                numberOfLines={2}
              >
                {item.title}
              </AppText>
              <AppText
                variant="body"
                align="center"
                style={[styles.description, { fontSize: descFontSize }]}
                numberOfLines={4}
              >
                {item.description}
              </AppText>
            </Animated.View>
          </View>
        )}
      />

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Dot Indicators */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleDotPress(index)}
              activeOpacity={0.7}
              style={[
                styles.dot,
                {
                  width: index === activeIndex ? activeDotWidth : dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor:
                    index === activeIndex ? currentSlide.color : Colors.neutral[300],
                },
              ]}
            />
          ))}
        </View>

        <AppDivider spacing={Spacing.md} />

        {/* Nút chính */}
        <AppButton
          title={activeIndex === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
          onPress={handleNext}
          style={{
            backgroundColor: Colors.primary[500],
            borderRadius: Spacing.borderRadius.xl,
            minHeight: 52,
            width: '100%',
          }}
          textStyle={styles.buttonText}
        />

        {activeIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <AppText variant="body" style={styles.skipText}>
              Bỏ qua
            </AppText>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.neutral[200],
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: Spacing.xl,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontFamily: Typography.fonts.bold,
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: Colors.neutral[900],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    color: Colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background.primary,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    // dynamic via inline style
  },
  button: {
    paddingVertical: Spacing.md,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipText: {
    color: Colors.neutral[500],
    fontSize: 14,
    fontWeight: '500',
  },
});
