export const isIOSDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const isIOSSafariMobile = (): boolean => {
  const isIOS = isIOSDevice();
  
  const isMobileViewport = window.innerWidth < 768;
  
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  return isIOS && isMobileViewport && isSafari;
};

export const isMobilePhoneDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  const isIPhone = /iphone|ipod/.test(userAgent);
  const isAndroidPhone = /android/.test(userAgent) && /mobile/.test(userAgent);

  return isIPhone || isAndroidPhone;
};
