
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cjuztbinihyimbedbqto.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqdXp0YmluaWh5aW1iZWRicXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMzM1MDcsImV4cCI6MjA4NjYwOTUwN30.qhNzEKHwtBumHOaJmCQnV2soyw0LvN9suulQvukmNbI';

/**
 * Supabase Client Initialization
 * 
 * SECURITY NOTE: 
 * 1. Row Level Security (RLS) must be enabled on all tables in the Supabase dashboard.
 * 2. Policies should ensure that users can only update/delete their own business data.
 * 3. The 'anon' key is used here for client-side operations. Sensitive operations 
 *    are protected by RLS policies based on the business ID.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

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

/**
 * Incrementa el contador de clics para un banner o evento.
 */
export const incrementClicks = async (table: 'banners' | 'events', id: string) => {
  try {
    // Intentamos obtener el valor actual
    const { data, error: fetchError } = await supabase
      .from(table)
      .select('clicks')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Incrementamos
    const { error: updateError } = await supabase
      .from(table)
      .update({ clicks: (data?.clicks || 0) + 1 })
      .eq('id', id);

    if (updateError) throw updateError;
  } catch (err) {
    console.error(`Error incrementando clics en ${table}:`, err);
  }
};
