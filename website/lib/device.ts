export const isSmartTV = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('android tv') ||
    ua.includes('smarttv') ||
    ua.includes('tizen') ||
    ua.includes('webos') ||
    ua.includes('tv') || 
    ua.includes('bravia') ||
    ua.includes('philips') ||
    ua.includes('viera') ||
    ua.includes('mitv') ||
    ua.includes('appletv')
  );
};
