import { useEffect, useState } from 'react';
import {
  BREAKPOINTS_PX,
  isCompactLaptopViewport,
  isLandscapePhoneViewport,
  isPortraitPhoneViewport,
} from '../constants/responsive';

interface ResponsiveFlags {
  isLandscapePhone: boolean;
  isPortraitMobile: boolean;
  isMobileRender: boolean;
  isCompactLaptop: boolean;
}

interface UseResponsiveFlagsOptions {
  portraitMobileMaxWidth?: number;
  syncLandscapeBodyClass?: boolean;
}

const DEFAULT_PORTRAIT_MOBILE_MAX_WIDTH = BREAKPOINTS_PX.MOBILE_LANDSCAPE_MAX;

const getResponsiveFlags = (
  width: number,
  height: number,
  portraitMobileMaxWidth: number
): ResponsiveFlags => {
  const isLandscapePhone = isLandscapePhoneViewport(width, height);
  const isPortraitMobile = isPortraitPhoneViewport(width, height, portraitMobileMaxWidth);
  const isCompactLaptop = isCompactLaptopViewport(width, height);

  return {
    isLandscapePhone,
    isPortraitMobile,
    isMobileRender: isLandscapePhone || isPortraitMobile,
    isCompactLaptop,
  };
};

export const useResponsiveFlags = (
  options?: UseResponsiveFlagsOptions
): ResponsiveFlags => {
  const portraitMobileMaxWidth =
    options?.portraitMobileMaxWidth ?? DEFAULT_PORTRAIT_MOBILE_MAX_WIDTH;
  const syncLandscapeBodyClass = options?.syncLandscapeBodyClass ?? false;

  const [flags, setFlags] = useState<ResponsiveFlags>({
    isLandscapePhone: false,
    isPortraitMobile: false,
    isMobileRender: false,
    isCompactLaptop: false,
  });

  useEffect(() => {
    const updateFlags = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const nextFlags = getResponsiveFlags(
        width,
        height,
        portraitMobileMaxWidth
      );

      setFlags(nextFlags);

      if (syncLandscapeBodyClass) {
        if (nextFlags.isLandscapePhone) {
          document.body.classList.add('android-landscape-phone');
        } else {
          document.body.classList.remove('android-landscape-phone');
        }
      }
    };

    updateFlags();
    window.addEventListener('resize', updateFlags);

    return () => {
      window.removeEventListener('resize', updateFlags);
      if (syncLandscapeBodyClass) {
        document.body.classList.remove('android-landscape-phone');
      }
    };
  }, [portraitMobileMaxWidth, syncLandscapeBodyClass]);

  return flags;
};
