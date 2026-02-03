'use client';

import { useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
}

/**
 * Lazy-loaded image component with blur placeholder and intersection observer
 */
export function LazyImage({ src, alt, className = '', width, height, priority = false }: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    const currentElement = document.querySelector(`[data-lazy-src="${src}"]`);
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  return (
    <div
      data-lazy-src={src}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#14161a] to-[#0a0b0e] animate-pulse" />
      )}
      
      {/* Actual image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        />
      )}
    </div>
  );
}
