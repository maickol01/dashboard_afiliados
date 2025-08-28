import { useState, useEffect } from 'react';

/**
 * Hook for detecting mobile devices and screen sizes
 * Returns true for screens smaller than 768px (mobile breakpoint)
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile,
    screenWidth,
    isTablet: screenWidth >= 768 && screenWidth < 1024,
    isDesktop: screenWidth >= 1024
  };
};

export default useMobileDetection;