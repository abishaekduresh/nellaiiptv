'use client';

import { useEffect } from 'react';

export default function DevToolsControl() {
  useEffect(() => {
    // Check if developer tools should be disabled
    const disableDevTools = (process.env.NEXT_PUBLIC_DISABLE_DEVTOOLS ?? 'true') === 'true';

    if (!disableDevTools) {
      return; // Developer tools are allowed
    }

    // Counter for consecutive DevTools detections
    let devToolsDetectionCount = 0;

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for developer tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Inspect Element
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (Windows/Linux) or Cmd+U (Mac) - View Source
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Windows/Linux) or Cmd+S (Mac) - Save Page
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Detect if DevTools is open and attempt to close/redirect
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        devToolsDetectionCount++;
        
        if (devToolsDetectionCount >= 3) {
          // After 3 detections, try to close the tab
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-family:Arial;font-size:24px;">Developer tools are not allowed. Closing...</div>';
          setTimeout(() => {
            window.close();
            // If window.close() doesn't work (tab not opened by script), redirect to blank
            setTimeout(() => {
              window.location.href = 'about:blank';
            }, 100);
          }, 500);
        } else {
          // Redirect to root page on first or second detection
          window.location.href = '/';
        }
      } else {
        // Reset counter if DevTools is closed
        devToolsDetectionCount = 0;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Disable console methods
    if (typeof window !== 'undefined') {
      const noop = () => {};
      window.console.log = noop;
      window.console.warn = noop;
      window.console.error = noop;
      window.console.info = noop;
      window.console.debug = noop;
      window.console.table = noop;
      window.console.clear = noop;
      window.console.trace = noop;
    }

    // Cleanup function
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  return null; // This component doesn't render anything
}
