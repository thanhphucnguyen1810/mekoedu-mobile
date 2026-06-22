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
  SafeAreaView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { C, Colors, Radius, Spacing, Typography } from '@/src/theme';

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
    title: 'Bắt đầu trải nghiệm với chúng tôi',
    description:
      'Truy cập 500+ khóa học chất lượng từ các chuyên gia hàng đầu. Kiến thức luôn sẵn sàng chỉ với một chạm.',
    icon: 'book',
    color: Colors.info,
  },
  {
    id: '02',
    title: 'Đánh giá năng lực tức thì',
    description:
      'Trải nghiệm phòng thi chuyên nghiệp với công nghệ chống gian lận thông minh. Nắm rõ điểm mạnh, yếu của bạn.',
    icon: 'shield-checkmark',
    color: Colors.primary[500],
  },
  {
    id: '03',
    title: 'Nhận chứng chỉ danh giá',
    description:
      'Hoàn thành khóa học và nhận chứng chỉ được công nhận. Mở rộng cơ hội nghề nghiệp tương lai ngay hôm nay.',
    icon: 'ribbon',
    color: Colors.accent[500],
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const { width: screenWidth } = useWindowDimensions()
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollViewRef = useRef<FlatList>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  // Responsive scale factor (giới hạn để không quá to trên tablet)
  const BASE_WIDTH = 390 // iPhone 14
  const scale = useMemo(() => Math.min(screenWidth / BASE_WIDTH, 1.5), [screenWidth])

  // Các kích thước được scale
  const iconSize = 150 * scale
  const iconMarginTop = Spacing['2xl'] * scale
  const iconMarginBottom = Spacing.xl * scale
  const horizontalPadding = Spacing.xl * scale
  const titleFontSize = (Typography.sizes['2xl'] || 24) * scale
  const descriptionFontSize = (Typography.sizes.md || 16) * scale
  const dotSize = 10 * scale
  const activeDotWidth = 28 * scale
  const dotsGap = Spacing.sm * scale
  const dotsMarginBottom = Spacing.lg * scale
  const buttonMarginBottom = Spacing[3] * scale

  // Tự động chuyển slide
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % slides.length
        scrollViewRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        })
        return nextIndex
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Hiệu ứng mờ + scale khi đổi slide
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [activeIndex])

  const handleNext = () => {
    if (activeIndex === slides.length - 1) {
      router.push('/welcome')
    } else {
      const nextIndex = activeIndex + 1
      scrollViewRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      })
      setActiveIndex(nextIndex)
    }
  }

  const handleSkip = () => {
    router.push('/welcome')
  }

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollToIndex({
      index,
      animated: true,
    })
    setActiveIndex(index)
  }

  const currentSlide = slides[activeIndex]
  const progress = ((activeIndex + 1) / slides.length) * 100

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar (giữ nguyên chiều cao nhỏ) */}
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
        contentContainerStyle={{ flexGrow: 1 }}
        onMomentumScrollEnd={(event) => {
          const contentOffsetX = event.nativeEvent.contentOffset.x
          const currentIndex = Math.round(contentOffsetX / screenWidth)
          if (currentIndex !== activeIndex) {
            setActiveIndex(currentIndex)
            fadeAnim.setValue(0)
            scaleAnim.setValue(0.8)
          }
        }}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, { paddingHorizontal: horizontalPadding }]}>
            <Animated.View
              style={[
                styles.iconContainerBase,
                {
                  width: iconSize,
                  height: iconSize,
                  borderRadius: iconSize / 2, // luôn tròn
                  marginTop: iconMarginTop,
                  marginBottom: iconMarginBottom,
                  backgroundColor: item.color,
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Ionicons name={item.icon} size={iconSize * 0.45} color={Colors.neutral[0]} />
              <View style={[styles.badgeBase, {
                width: iconSize * 0.3,
                height: iconSize * 0.3,
                borderRadius: iconSize * 0.15,
                top: -iconSize * 0.08,
                right: -iconSize * 0.08,
              }]}>
                <AppText style={{ fontSize: iconSize * 0.12, fontFamily: Typography.fonts.bold, color: item.color }}>
                  {item.id}
                </AppText>
              </View>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim }}>
              <AppText
                variant="h2"
                align="center"
                style={[styles.title, { fontSize: titleFontSize, marginBottom: Spacing.md * scale }]}
                numberOfLines={3}
              >
                {item.title}
              </AppText>
              <AppText
                variant="body"
                align="center"
                style={[styles.description, { fontSize: descriptionFontSize }]}
                numberOfLines={4}
              >
                {item.description}
              </AppText>
            </Animated.View>
          </View>
        )}
      />

      {/* Bottom Section */}
      <View style={[styles.bottomContainer, { paddingHorizontal: horizontalPadding }]}>
        {/* Dot Indicators */}
        <View style={[styles.dotsContainer, { gap: dotsGap, marginBottom: dotsMarginBottom }]}>
          {slides.map((_, index) => (
            <AppButton
              key={index}
              onPress={() => handleDotPress(index)}
              style={{
                height: dotSize,
                width: index === activeIndex ? activeDotWidth : dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: index === activeIndex ? currentSlide.color : C.border,
              }}
            />
          ))}
        </View>

        <AppDivider spacing={Spacing.md} />

        {/* Nút chính (màu đỏ cố định) */}
        <AppButton
          onPress={handleNext}
          style={[
            styles.button,
            {
              backgroundColor: Colors.primary[500],
              marginBottom: buttonMarginBottom,
              borderRadius: Radius.xl * scale,
            },
          ]}
          textStyle={styles.buttonText}
        >
          {activeIndex === slides.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
        </AppButton>

        {activeIndex < slides.length - 1 && (
          <AppButton
            onPress={handleSkip}
            mode="text"
            style={styles.skipButton}
            textStyle={[styles.skipButtonText, { fontSize: descriptionFontSize }]}
          >
            Bỏ qua
          </AppButton>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgSoft,
  },
  progressBarContainer: {
    height: Spacing.xs,
    backgroundColor: C.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // sẽ được set bằng screenWidth trong FlatList, nhưng để chắc chắn
  },
  iconContainerBase: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: Colors.neutral[1000],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeBase: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[0],
    shadowColor: Colors.neutral[1000],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    color: C.text,
  },
  description: {
    color: C.textSub,
  },
  bottomContainer: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    borderRadius: Radius.xl,
  },
  buttonText: {
    color: Colors.neutral[0],
  },
  skipButton: {
    backgroundColor: 'transparent',
  },
  skipButtonText: {
    color: C.textSub,
  },
})
 