
import React, { useState, useRef, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon, Loader2, X, Plus, ChevronRight, Camera, Crown } from 'lucide-react';
import { Business, PlanType } from '../types';
import { compressImage } from '../utils/image';
import { uploadImage } from '../lib/supabase';

const OwnerGallery: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [formData, setFormData] = useState({ ...business });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...business });
  }, [business.id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const maxPhotos = business.plan === PlanType.PRO ? 10 : 1;
    const currentPhotos = formData.coverPhotos || [];
    
    if (currentPhotos.length >= maxPhotos) {
      alert(`Tu plan actual (${business.plan}) solo permite hasta ${maxPhotos} fotos en total.`);
      return;
    }

    setIsUploading(true);
    try {
      const file = files[0];
      const compressed = await compressImage(file, 1400, 0.7);
      const url = await uploadImage(compressed, `gallery/${business.id}`);
      setFormData(prev => ({ ...prev, coverPhotos: [...(prev.coverPhotos || []), url] }));
    } catch (err) {
      alert("Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coverPhotos: (prev.coverPhotos || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(formData);
      alert('¡Galería actualizada!');
    } catch (err) {
      alert('Error al guardar cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  // La galería muestra todas las fotos excepto la primera (que es el banner)
  const galleryPhotos = (formData.coverPhotos || []).slice(1);
  const maxGalleryPhotos = (business.plan === PlanType.PRO ? 10 : 1) - 1;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Galería de fotos</h1>
          <p className="text-gray-500 font-medium">Gestiona las imágenes que muestran lo mejor de tu local y tus platos.</p>
        </div>
        {(formData.coverPhotos?.length || 0) < (business.plan === PlanType.PRO ? 10 : 1) && (
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="w-full md:w-auto bg-amber-500 text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-amber-400 transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} strokeWidth={3} />} 
            Añadir Foto
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-[#1a1a1c] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Camera className="text-amber-500" size={24} />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Fotos de la galería ({galleryPhotos.length}/{maxGalleryPhotos})</h2>
          </div>

          {galleryPhotos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {galleryPhotos.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-3xl overflow-hidden group border border-white/5 shadow-xl">
                  <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`Foto ${index + 1}`} />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => removePhoto(index + 1)} 
                      className="bg-red-500 text-white p-3 rounded-2xl hover:bg-red-600 transition-colors shadow-2xl transform scale-75 group-hover:scale-100 duration-300"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
              <ImageIcon className="mx-auto text-gray-800 mb-4" size={48} />
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No hay fotos en la galería</p>
              <p className="text-gray-600 text-[10px] mt-2 uppercase tracking-widest">Sube fotos de tu local, platos o ambiente.</p>
            </div>
          )}
          
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
        </section>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isSaving || isUploading}
            className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            Guardar Galería
          </button>
        </div>
      </form>

      {business.plan === PlanType.FREE && (
        <div className="mt-12 bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center shrink-0 shadow-xl">
            <Crown size={32} fill="currentColor" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-white font-bold text-lg mb-1 uppercase tracking-tight">¿Necesitas más espacio?</h3>
            <p className="text-gray-400 text-sm font-medium">El Plan PRO te permite subir hasta 10 fotos en tu galería para mostrar todo tu potencial.</p>
          </div>
          <ChevronRight className="text-amber-500 hidden md:block" size={24} />
        </div>
      )}
    </div>
  );
};

export default OwnerGallery;
