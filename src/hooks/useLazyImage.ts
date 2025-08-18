import { useState, useEffect, useRef } from 'react';

interface UseLazyImageOptions {
  src: string;
  rootMargin?: string;
  threshold?: number;
}

export function useLazyImage({ src, rootMargin = '50px', threshold = 0.1 }: UseLazyImageOptions) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement || !src) return;

    // If Intersection Observer is not supported, load immediately
    if (!('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(containerElement);
          }
        });
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(containerElement);

    return () => {
      if (containerElement) {
        observer.unobserve(containerElement);
      }
    };
  }, [src, rootMargin, threshold]);

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  return {
    containerRef,
    imageSrc,
    isLoaded,
    isError,
    handleLoad,
    handleError,
  };
}
