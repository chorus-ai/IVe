import { useEffect, useState } from 'react';

// Tracks the `dark` class on <html>, which the app header toggles.
// Needed by components that pass colors to canvas renderers (ECharts),
// where Tailwind dark: variants can't reach.
export default function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
