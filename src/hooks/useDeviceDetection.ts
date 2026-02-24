import { useState, useEffect } from 'react';

type DeviceType = 'nestHub' | 'nestHubMax' | 'surfaceDuo' | null;

interface DeviceDetection {
  nestHub: boolean;
  nestHubMax: boolean;
  surfaceDuo: boolean;
  currentDevice: DeviceType;
}

/**
 * Custom hook to detect specific device dimensions
 * Returns boolean flags for each supported device type
 * 
 * Usage:
 * const { nestHub, nestHubMax, surfaceDuo } = useDeviceDetection();
 * 
 * Then apply classes conditionally:
 * className={`${styles.element} ${nestHub ? styles.elementNesthub : ''}`}
 */
export const useDeviceDetection = (): DeviceDetection => {
  const [detection, setDetection] = useState<DeviceDetection>({
    nestHub: false,
    nestHubMax: false,
    surfaceDuo: false,
    currentDevice: null,
  });

  useEffect(() => {
    const checkDevices = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      console.log(`Device dimensions: ${width}x${height}`); // Debug log

      const isNestHub = width === 1024 && height === 600;
      const isNestHubMax = width === 1280 && height === 800;
      const isSurfaceDuo = width === 540 && height === 720;

      setDetection({
        nestHub: isNestHub,
        nestHubMax: isNestHubMax,
        surfaceDuo: isSurfaceDuo,
        currentDevice: isNestHub ? 'nestHub' : isNestHubMax ? 'nestHubMax' : isSurfaceDuo ? 'surfaceDuo' : null,
      });
    };

    // Check immediately on mount
    checkDevices();
    
    // Also check on resize
    window.addEventListener('resize', checkDevices);
    return () => window.removeEventListener('resize', checkDevices);
  }, []);

  return detection;
};
