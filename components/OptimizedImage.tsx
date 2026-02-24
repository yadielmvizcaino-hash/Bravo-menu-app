
import React, { useState, useEffect } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className, 
  containerClassName = "", 
  loading = "lazy",
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Resetear el estado cuando la fuente de la imagen cambia (ej. al actualizar foto de portada)
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-[#1a1a1c] ${containerClassName}`}>
      {/* Shimmer Placeholder */}
      {!isLoaded && !hasError && (
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
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ease-in-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
