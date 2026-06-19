/* SPACING SYSTEM - Hệ thống khoảng cách cho toàn bộ ứng dụng 
  - Sử dụng hệ thống lưới 8px  (8-point grid system)
  - Tất cả khoảng cách đề là bội số của 4 hoặc 8
*/

export const Spacing = {
  /* BASE SPACING - 4px system */
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,

  /* SEMANTIC SPACING - Ngữ nghĩa */
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,

  /* COMPONENT SPECIFIC SPACING */
  component: {
    // padding mặc định cho button
    buttonPadding: {
      vertical: 12, // 12px trên dưới
      horizontal: 24, // 24px trái phải
    },
    cardPadding: 16, // padding mặc định cho card
    listGap: 12, // Khoảng cách giữa các items trong list
    iconGap: 8, // khoảng cách giữa các icon
    inputPadding: 12, // padding cho input field
  },

  /* LAYOUT SPACING  */
  layout: {
    screenHorizontal: 16, // padding ngang cho màn hình (trái/phải)
    screenVertical: 20, // padding dọc (trên/dưới)
    sectionGap: 24, // khoảng cách giữa các session trong màn hình
    gridGap: 16, // kc giữa các hàng trong grid
    columnGap: 12, // kc giữa các cột trong grid
  },

  /* BORDER RADIUS */
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },

  /* BORDER WIDTH */
  borderWidth: {
    thin: 0.5,
    normal: 1,
    thick: 2,
    heavy: 3,
  },

  /* OPACITY */
  opacity: {
    invisible: 0,
    subtle: 0.1,
    light: 0.3,
    medium: 0.5,
    heavy: 0.7,
    dark: 0.9,
    opaque: 1,
  },
} as const;

// ==================== TYPE DEFINITIONS ====================
export type SpacingType = typeof Spacing;
export type SpacingLevel = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof Spacing.borderRadius;

// ==================== HELPER FUNCTIONS ====================

/**
 * Tạo khoảng cách margin theo hướng
 *
 * @param spacing - Giá trị spacing từ hệ thống
 * @param direction - Hướng áp dụng (top, right, bottom, left, horizontal, vertical, all)
 * @returns Style object với margin tương ứng
 *
 * @example
 * const styles = StyleSheet.create({
 *   box: {
 *     ...getMargin(Spacing[4], 'all'), // margin: 16
 *     ...getMargin(Spacing[2], 'horizontal'), // marginHorizontal: 8
 *   }
 * });
 */
export const getMargin = (
  spacing: number,
  direction:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'horizontal'
    | 'vertical'
    | 'all' = 'all',
) => {
  switch (direction) {
    case 'top':
      return { marginTop: spacing };
    case 'right':
      return { marginRight: spacing };
    case 'bottom':
      return { marginBottom: spacing };
    case 'left':
      return { marginLeft: spacing };
    case 'horizontal':
      return { marginHorizontal: spacing };
    case 'vertical':
      return { marginVertical: spacing };
    default:
      return { margin: spacing };
  }
};

/**
 * Tạo khoảng cách padding theo hướng
 *
 * @param spacing - Giá trị spacing từ hệ thống
 * @param direction - Hướng áp dụng (top, right, bottom, left, horizontal, vertical, all)
 * @returns Style object với padding tương ứng
 *
 * @example
 * const styles = StyleSheet.create({
 *   container: {
 *     ...getPadding(Spacing[4], 'horizontal'), // paddingHorizontal: 16
 *     ...getPadding(Spacing[2], 'vertical'), // paddingVertical: 8
 *   }
 * });
 */
export const getPadding = (
  spacing: number,
  direction:
    | 'top'
    | 'right'
    | 'bottom'
    | 'left'
    | 'horizontal'
    | 'vertical'
    | 'all' = 'all',
) => {
  switch (direction) {
    case 'top':
      return { paddingTop: spacing };
    case 'right':
      return { paddingRight: spacing };
    case 'bottom':
      return { paddingBottom: spacing };
    case 'left':
      return { paddingLeft: spacing };
    case 'horizontal':
      return { paddingHorizontal: spacing };
    case 'vertical':
      return { paddingVertical: spacing };
    default:
      return { padding: spacing };
  }
};

export const getGap = (spacing: number): number => spacing;

// ==================== SHORTCUTS (Tiện ích) ====================

export const SpacingUtils = {
  /** Padding màn hình chuẩn */
  screen: {
    paddingHorizontal: Spacing.layout.screenHorizontal,
    paddingVertical: Spacing.layout.screenVertical,
  },

  /** Gap giữa các item trong list */
  listItem: {
    marginBottom: Spacing.component.listGap,
  },

  /** Style cho card chuẩn */
  card: {
    padding: Spacing.component.cardPadding,
    borderRadius: Spacing.borderRadius.lg,
  },

  /** Style cho button chuẩn */
  button: {
    paddingVertical: Spacing.component.buttonPadding.vertical,
    paddingHorizontal: Spacing.component.buttonPadding.horizontal,
    borderRadius: Spacing.borderRadius.md,
  },
} as const;

export const Radius = Spacing.borderRadius;
