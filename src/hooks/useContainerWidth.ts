import { useEffect, useState, type RefObject } from 'react';

/**
 * Tracks the rendered width of the application root and exposes it as a CSS custom property
 * so layout can respond to the SPFx web-part box, not only the viewport.
 */
export function useContainerWidth(rootRef: RefObject<HTMLElement | undefined>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = rootRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const updateWidth = (nextWidth: number): void => {
      const safeWidth = Math.max(0, Math.round(nextWidth));
      setWidth(safeWidth);
      element.style.setProperty('--zef-app-width', `${safeWidth}px`);
    };

    updateWidth(element.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const inlineSize = entry.contentBoxSize?.[0]?.inlineSize;
      updateWidth(inlineSize ?? entry.contentRect.width);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      element.style.removeProperty('--zef-app-width');
    };
  }, [rootRef]);

  return width;
}
