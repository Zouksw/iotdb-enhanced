/**
 * Responsive Breakpoint Constants
 *
 * Single source of truth for breakpoint usage across the application.
 * Provides unified breakpoint definitions and component-specific breakpoints.
 *
 * Breakpoint Definitions:
 * - Mobile: 0-767px (xs, sm)
 * - Tablet: 768-1023px (md)
 * - Desktop: 1024px+ (lg, xl, 2xl)
 */

// Unified breakpoint usage guide
export const BREAKPOINT = {
  MOBILE: { min: 0, max: 767 },     // xs, sm
  TABLET: { min: 768, max: 1023 },   // md
  DESKTOP: { min: 1024, max: Infinity }, // lg, xl, 2xl
} as const;

// Tailwind's default breakpoints for reference
export const TAILWIND_BREAKPOINTS = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Component-specific breakpoints
export const COMPONENT_BREAKPOINTS = {
  // Navigation
  SIDEBAR_HIDE: 767,    // Hide sidebar below tablet
  BOTTOM_NAV_SHOW: 767, // Show bottom nav on mobile

  // Layout
  GRID_SINGLE_COLUMN: 640,
  GRID_TWO_COLUMN: 768,
  GRID_THREE_COLUMN: 1024,
  GRID_FOUR_COLUMN: 1280,

  // Tables
  TABLE_SCROLL: 767,    // Enable horizontal scroll
  TABLE_COMPACT: 640,   // Compact padding

  // Forms
  FORM_STACK: 640,      // Stack form fields
  FORM_INLINE: 768,     // Inline form fields

  // Cards
  CARD_STACK: 640,      // Stack cards vertically
  CARD_GRID: 768,       // Grid layout for cards

  // Charts
  CHART_FULLSCREEN: 640,  // Full width charts
  CHART_COMPACT: 1024,    // Compact charts

  // Typography
  TEXT_SCALE: 768,      // Scale text up
  HEADING_SCALE: 1024,  // Scale headings up
} as const;

// Media query helpers
export const mq = {
  mobile: `@media (max-width: ${BREAKPOINT.MOBILE.max}px)`,
  tablet: `@media (min-width: ${BREAKPOINT.TABLET.min}px) and (max-width: ${BREAKPOINT.TABLET.max}px)`,
  desktop: `@media (min-width: ${BREAKPOINT.DESKTOP.min}px)`,

  // Specific breakpoints
  "mobile-only": `@media (max-width: 639px)`,
  "sm": `@media (min-width: 640px)`,
  "md": `@media (min-width: 768px)`,
  "lg": `@media (min-width: 1024px)`,
  "xl": `@media (min-width: 1280px)`,
  "2xl": `@media (min-width: 1536px)`,
} as const;

// Breakpoint names for type safety
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

// Breakpoint values in pixels
export const BREAKPOINT_VALUES: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

// Helper function to get current breakpoint (client-side only)
export const getCurrentBreakpoint = (): Breakpoint => {
  if (typeof window === "undefined") return "md";

  const width = window.innerWidth;

  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  if (width < 1536) return "xl";
  return "2xl";
};

// Helper function to check if current breakpoint matches or is larger
export const isBreakpointOrLarger = (breakpoint: Breakpoint): boolean => {
  const current = getCurrentBreakpoint();
  return BREAKPOINT_VALUES[current] >= BREAKPOINT_VALUES[breakpoint];
};

// Helper function to check if current breakpoint matches or is smaller
export const isBreakpointOrSmaller = (breakpoint: Breakpoint): boolean => {
  const current = getCurrentBreakpoint();
  return BREAKPOINT_VALUES[current] <= BREAKPOINT_VALUES[breakpoint];
};

// Helper function to check if mobile
export const isMobile = (): boolean => {
  return isBreakpointOrSmaller("sm");
};

// Helper function to check if tablet
export const isTablet = (): boolean => {
  const current = getCurrentBreakpoint();
  return current === "md";
};

// Helper function to check if desktop
export const isDesktop = (): boolean => {
  return isBreakpointOrLarger("lg");
};

// Responsive value getter
export const getResponsiveValue = <T,>(
  values: Partial<Record<Breakpoint, T>>,
  defaultValue: T
): T => {
  const current = getCurrentBreakpoint();

  // Find the largest breakpoint that's <= current and has a value
  const breakpoints: Breakpoint[] = ["2xl", "xl", "lg", "md", "sm", "xs"];
  for (const bp of breakpoints) {
    if (BREAKPOINT_VALUES[bp] <= BREAKPOINT_VALUES[current] && values[bp] !== undefined) {
      return values[bp]!;
    }
  }

  return defaultValue;
};

// Column count for responsive grids
export const getGridColumns = (breakpoint: Breakpoint): number => {
  const columnMap: Record<Breakpoint, number> = {
    xs: 1,
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
    "2xl": 4,
  };
  return columnMap[breakpoint];
};

// Spacing for responsive layouts
export const getResponsiveSpacing = (breakpoint: Breakpoint): string => {
  const spacingMap: Record<Breakpoint, string> = {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    "2xl": "48px",
  };
  return spacingMap[breakpoint];
};
