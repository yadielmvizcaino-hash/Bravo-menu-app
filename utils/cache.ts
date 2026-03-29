
import localforage from 'localforage';

// Configurar localforage
localforage.config({
  name: 'gallery-menus-cache',
  storeName: 'app_data'
});

/**
 * Estrategia Stale-While-Revalidate para datos de la API
 * @param key Clave única para el caché
 * @param fetcher Función que obtiene los datos frescos de la API
 * @param onUpdate Callback opcional cuando los datos frescos llegan
 */
export const getWithCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  onUpdate?: (data: T) => void
): Promise<T> => {
  // 1. Intentar obtener del caché inmediatamente
  const cached = await localforage.getItem<T>(key);
  
  // 2. Iniciar revalidación en background
  const revalidate = async () => {
    try {
      const fresh = await fetcher();
      await localforage.setItem(key, fresh);
      if (onUpdate) onUpdate(fresh);
      return fresh;
    } catch (error) {
      console.error(`Error revalidating key ${key}:`, error);
      throw error;
    }
  };

  // Si hay caché, devolverlo y revalidar en background
  if (cached) {
    revalidate(); // No esperamos el resultado
    return cached;
  }

  // Si no hay caché, esperar a los datos frescos
  return revalidate();
};

export const clearCache = () => localforage.clear();
