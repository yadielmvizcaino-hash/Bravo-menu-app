/**
 * Comprime y redimensiona una imagen en el lado del cliente.
 * @param file El archivo de imagen original
 * @param maxWidth Ancho máximo deseado (por defecto 1200px)
 * @param quality Calidad de compresión de 0 a 1 (por defecto 0.7)
 */
export const compressImage = async (file: File, maxWidth = 1200, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionar si es necesario manteniendo el aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto del canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('La conversión de Canvas a Blob falló'));
          },
          'image/jpeg',
          quality
        );
      };
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Convierte un Blob a una URL de objeto para previsualización.
 */
export const getPreviewUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};
