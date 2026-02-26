/**
 * RESPONSIVE DESIGN BREAKPOINTS & STRATEGY
 * 
 * Device Rendering Strategy:
 * - Each device type (Mobile, Tablet, Desktop) has INDEPENDENT rendering sections
 * - Portrait and Landscape orientations are separately defined
 * - Changes in one section do NOT affect others
 * 
 * Breakpoint Strategy:
 * Mobile Portrait:  max-width: 479px | orientation: portrait
 * Mobile Landscape: max-width: 767px | orientation: landscape
 * Tablet Portrait:  480px - 1023px   | orientation: portrait
 * Tablet Landscape: 768px - 1199px   | orientation: landscape
 * Desktop:          min-width: 1200px (no media query needed)
 */

export const RESPONSIVE_BREAKPOINTS = {
  // Mobile devices (phones)
  MOBILE_PORTRAIT_MAX: '479px',
  MOBILE_LANDSCAPE_MAX: '767px',

  // Tablet devices
  TABLET_PORTRAIT_MIN: '480px',
  TABLET_PORTRAIT_MAX: '1023px',
  TABLET_LANDSCAPE_MIN: '768px',
  TABLET_LANDSCAPE_MAX: '1199px',

  // Desktop
  DESKTOP_MIN: '1200px',
};

export const MEDIA_QUERIES = {
  MOBILE_PORTRAIT: '@media (max-width: 479px)',
  MOBILE_LANDSCAPE: '@media (max-width: 767px) and (orientation: landscape)',
  TABLET_PORTRAIT: '@media (min-width: 480px) and (max-width: 1023px) and (orientation: portrait)',
  TABLET_LANDSCAPE: '@media (min-width: 768px) and (max-width: 1199px) and (orientation: landscape)',
  DESKTOP: '@media (min-width: 1200px)',
};

export const CLAMP_FONT_SIZES = {
  H1: 'clamp(1.8rem, 5vw, 3rem)',
  H2: 'clamp(1.5rem, 4vw, 2.5rem)',
  H3: 'clamp(1.2rem, 3vw, 2rem)',
  BODY: 'clamp(0.95rem, 2vw, 1.2rem)',
  SMALL: 'clamp(0.8rem, 1.5vw, 1rem)',
};

export const ASPECT_RATIOS = {
  HERO: '16 / 9',
  IMAGE_CARD: '4 / 3',
  SQUARE: '1 / 1',
  PORTRAIT: '3 / 4',
};

const toPx = (value: string) => parseInt(value, 10);

export const BREAKPOINTS_PX = {
  MOBILE_PORTRAIT_MAX: toPx(RESPONSIVE_BREAKPOINTS.MOBILE_PORTRAIT_MAX),
  MOBILE_LANDSCAPE_MAX: toPx(RESPONSIVE_BREAKPOINTS.MOBILE_LANDSCAPE_MAX),
  TABLET_PORTRAIT_MIN: toPx(RESPONSIVE_BREAKPOINTS.TABLET_PORTRAIT_MIN),
  TABLET_PORTRAIT_MAX: toPx(RESPONSIVE_BREAKPOINTS.TABLET_PORTRAIT_MAX),
  TABLET_LANDSCAPE_MIN: toPx(RESPONSIVE_BREAKPOINTS.TABLET_LANDSCAPE_MIN),
  TABLET_LANDSCAPE_MAX: toPx(RESPONSIVE_BREAKPOINTS.TABLET_LANDSCAPE_MAX),
  DESKTOP_MIN: toPx(RESPONSIVE_BREAKPOINTS.DESKTOP_MIN),
} as const;

export type DeviceFamily =
  | 'mobile-portrait'
  | 'mobile-landscape'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'desktop';

export const isPortraitViewport = (width: number, height: number) =>
  width > 0 && height > 0 && height >= width;

export const isLandscapeViewport = (width: number, height: number) =>
  width > 0 && height > 0 && width > height;

export const isLandscapePhoneViewport = (width: number, height: number) =>
  isLandscapeViewport(width, height) &&
  width <= BREAKPOINTS_PX.MOBILE_LANDSCAPE_MAX &&
  width / height >= 1.8 &&
  height <= 800;

export const isPortraitPhoneViewport = (
  width: number,
  height: number,
  maxWidth: number = BREAKPOINTS_PX.MOBILE_LANDSCAPE_MAX
) => isPortraitViewport(width, height) && width <= maxWidth;

export const isCompactLaptopViewport = (width: number, height: number) =>
  width >= 1280 && width <= 1500 && height >= 700;

export const getDeviceFamily = (width: number, height: number): DeviceFamily => {
  if (isLandscapePhoneViewport(width, height)) {
    return 'mobile-landscape';
  }

  if (
    isPortraitViewport(width, height) &&
    width <= BREAKPOINTS_PX.MOBILE_PORTRAIT_MAX
  ) {
    return 'mobile-portrait';
  }

  if (
    isPortraitViewport(width, height) &&
    width >= BREAKPOINTS_PX.TABLET_PORTRAIT_MIN &&
    width <= BREAKPOINTS_PX.TABLET_PORTRAIT_MAX
  ) {
    return 'tablet-portrait';
  }

  if (
    isLandscapeViewport(width, height) &&
    width >= BREAKPOINTS_PX.TABLET_LANDSCAPE_MIN &&
    width <= BREAKPOINTS_PX.TABLET_LANDSCAPE_MAX
  ) {
    return 'tablet-landscape';
  }

  return 'desktop';
};
