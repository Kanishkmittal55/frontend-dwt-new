import { useEffect } from 'react';
import type { NavigationScrollProps } from 'types/utilities';

// ==============================|| NAVIGATION SCROLL TO TOP ||============================== //

export default function NavigationScroll({ children }: NavigationScrollProps) {
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  });

  return children || null;
}