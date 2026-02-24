
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjuztbinihyimbedbqto.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdXp0YmluaWh5aW1iZWRicXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMzM1MDcsImV4cCI6MjA4NjYwOTUwN30.qhNzEKHwtBumHOaJmCQnV2soyw0LvN9suulQvukmNbI';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Sube una imagen al Storage de Supabase.
 * Si falla por red o configuración, devuelve una DataURL local para que la app siga funcionando.
 */
export const uploadImage = async (file: Blob, path: string): Promise<string> => {
  try {
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, file, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (err) {
    console.warn("La subida a Supabase falló (posible proyecto pausado o error de red). Usando fallback local...", err);
    
    // Fallback: Convertir el Blob a DataURL para que el usuario vea su foto de todas formas
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
};
