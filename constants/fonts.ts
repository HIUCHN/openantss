/**
 * Font constants for consistent typography
 */

export const FONTS = {
  FAMILY: {
    REGULAR: 'Inter-Regular',
    MEDIUM: 'Inter-Medium',
    SEMIBOLD: 'Inter-SemiBold',
    BOLD: 'Inter-Bold',
  },
  
  SIZE: {
    XS: 10,
    SM: 12,
    BASE: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
    HEADING_SM: 28,
    HEADING_MD: 32,
    HEADING_LG: 36,
    HEADING_XL: 48,
  },
  
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.8,
  },
  
  WEIGHT: {
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
} as const;