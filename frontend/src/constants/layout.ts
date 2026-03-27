/**
 * Layout Constants
 *
 * Reusable responsive layout configurations for Ant Design components.
 * Eliminates code duplication and provides consistent responsive behavior.
 */

import type { Breakpoint } from 'antd';

/**
 * Responsive column configuration for grid layouts
 *
 * @example
 * ```tsx
 * <Row gutter={GRID_GUTTER}>
 *   {items.map(item => (
 *     <Col {...GRID_COLUMNS_RESPONSIVE}>
 *       <Card>{item}</Card>
 *     </Col>
 *   ))}
 * </Row>
 * ```
 */
export const GRID_COLUMNS_RESPONSIVE: Partial<Record<Breakpoint, number>> = {
  xs: 1,  // Mobile: 1 column
  sm: 1,  // Small mobile: 1 column
  md: 2,  // Tablet: 2 columns
  lg: 3,  // Desktop: 3 columns
  xl: 4,  // Large desktop: 4 columns
  xxl: 4, // Extra large desktop: 4 columns
};

/**
 * Compact grid for smaller cards
 */
export const GRID_COLUMNS_COMPACT: Partial<Record<Breakpoint, number>> = {
  xs: 1,
  sm: 2,
  md: 2,
  lg: 3,
  xl: 4,
  xxl: 5,
};

/**
 * Wide grid for larger cards
 */
export const GRID_COLUMNS_WIDE: Partial<Record<Breakpoint, number>> = {
  xs: 1,
  sm: 1,
  md: 1,
  lg: 2,
  xl: 2,
  xxl: 3,
};

/**
 * Standard gutter spacing for grids
 */
export const GRID_GUTTER: [number, number] = [16, 16];

/**
 * Large gutter for spacious layouts
 */
export const GRID_GUTTER_LARGE: [number, number] = [24, 24];

/**
 * Small gutter for compact layouts
 */
export const GRID_GUTTER_SMALL: [number, number] = [8, 8];

/**
 * Responsive configuration for statistics cards
 */
export const STATS_CARD_RESPONSIVE: Partial<Record<Breakpoint, number>> = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 2,
  xl: 3,
  xxl: 4,
};

/**
 * Responsive configuration for form layouts
 */
export const FORM_RESPONSIVE: Partial<Record<Breakpoint, number>> = {
  xs: 1,
  sm: 1,
  md: 1,
  lg: 2,
  xl: 2,
  xxl: 2,
};

/**
 * Responsive configuration for detail pages
 */
export const DETAIL_PAGE_RESPONSIVE: Partial<Record<Breakpoint, number>> = {
  xs: 1,
  sm: 1,
  md: 1,
  lg: 2,
  xl: 2,
  xxl: 3,
};

/**
 * Full width configuration
 */
export const FULL_WIDTH_RESPONSIVE: Partial<Record<Breakpoint, number>> = {
  xs: 1,
  sm: 1,
  md: 1,
  lg: 1,
  xl: 1,
  xxl: 1,
};

/**
 * Get responsive columns for a specific breakpoint pattern
 *
 * @param pattern - Predefined pattern name
 * @returns Responsive column configuration
 */
export function getResponsiveColumns(
  pattern: 'standard' | 'compact' | 'wide' | 'stats' | 'form' | 'detail' | 'full' = 'standard'
): Partial<Record<Breakpoint, number>> {
  const patterns = {
    standard: GRID_COLUMNS_RESPONSIVE,
    compact: GRID_COLUMNS_COMPACT,
    wide: GRID_COLUMNS_WIDE,
    stats: STATS_CARD_RESPONSIVE,
    form: FORM_RESPONSIVE,
    detail: DETAIL_PAGE_RESPONSIVE,
    full: FULL_WIDTH_RESPONSIVE,
  };

  return patterns[pattern];
}

/**
 * Get gutter configuration
 *
 * @param size - Gutter size
 * @returns Gutter array [horizontal, vertical]
 */
export function getGutter(size: 'small' | 'standard' | 'large' = 'standard'): [number, number] {
  const gutters = {
    small: GRID_GUTTER_SMALL,
    standard: GRID_GUTTER,
    large: GRID_GUTTER_LARGE,
  };

  return gutters[size];
}
