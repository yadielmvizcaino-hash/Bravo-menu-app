
import React, { useState, useEffect, useMemo } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
  lowQualitySrc?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName = "", 
  lowQualitySrc,
  loading = "lazy",
  fetchPriority = "auto",
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Intentar generar una versión de baja calidad si es de Unsplash y no se proporcionó una
  const placeholderSrc = useMemo(() => {
    if (lowQualitySrc) return lowQualitySrc;
    if (src && src.includes('unsplash.com')) {
      // Si es Unsplash, podemos pedir una versión minúscula y borrosa
      return `${src}${src.includes('?') ? '&' : '?' }w=50&q=30&blur=10`;
    }
    return null;
  }, [src, lowQualitySrc]);

  // Resetear el estado cuando la fuente de la imagen cambia
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-black ${containerClassName}`}>
      {/* Low Quality Placeholder / Blur-up */}
      {placeholderSrc && !isLoaded && !hasError && (
        <img
          src={placeholderSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 transition-opacity duration-500"
          aria-hidden="true"
        />
      )}

      {/* Shimmer Placeholder (si no hay imagen de baja calidad) */}
      {!isLoaded && !hasError && !placeholderSrc && (
        <div className="absolute inset-0 shimmer bg-white/5" />
      )}
      
      {/* Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-700 p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest">Error de imagen</span>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        loading={loading}
        {...({ fetchpriority: fetchPriority } as any)}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-all duration-700 ease-in-out ${
          isLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-md'
        } ${className}`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
