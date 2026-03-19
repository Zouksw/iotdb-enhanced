/**
 * Breakpoint Configuration
 *
 * Standard breakpoint values for responsive design
 */

export const breakpoints = {
  xs: '320px',   // Mobile portrait
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet portrait
  lg: '1024px',  // Tablet landscape, small desktop
  xl: '1280px',  // Desktop
  '2xl': '1536px' // Large desktop
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const breakpointValues = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Media query helpers
 */
export const mediaQuery = {
  xs: `@media (max-width: ${breakpoints.sm})`,
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,

  // Max-width queries
  maxSm: `@media (max-width: ${breakpoints.sm})`,
  maxMd: `@media (max-width: ${breakpoints.md})`,
  maxLg: `@media (max-width: ${breakpoints.lg})`,

  // Ranges
  smToMd: `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.md})`,
  mdToLg: `@media (min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,

  // Orientation
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',

  // Dark mode
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)'
};

/**
 * Get current breakpoint from window width
 */
export function getCurrentBreakpoint(width: number): Breakpoint {
  if (width < breakpointValues.sm) return 'xs';
  if (width < breakpointValues.md) return 'sm';
  if (width < breakpointValues.lg) return 'md';
  if (width < breakpointValues.xl) return 'lg';
  if (width < breakpointValues['2xl']) return 'xl';
  return '2xl';
}

/**
 * Check if width matches breakpoint
 */
export function isBreakpoint(width: number, bp: Breakpoint): boolean {
  return getCurrentBreakpoint(width) === bp;
}

/**
 * Check if width is at least breakpoint
 */
export function isMinBreakpoint(width: number, bp: Breakpoint): boolean {
  return width >= breakpointValues[bp];
}

/**
 * Check if width is at most breakpoint
 */
export function isMaxBreakpoint(width: number, bp: Breakpoint): boolean {
  return width <= breakpointValues[bp];
}
