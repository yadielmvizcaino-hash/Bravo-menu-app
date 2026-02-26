
import React, { useState, useRef, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon, Loader2, X, Plus, ChevronRight } from 'lucide-react';
import { Business, PlanType } from '../types';
import { compressImage } from '../utils/image';
import { uploadImage } from '../lib/supabase';

const OwnerIdentity: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [formData, setFormData] = useState({ ...business });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData({ ...business });
  }, [business.id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const compressed = await compressImage(file, 400, 0.7);
      const url = await uploadImage(compressed, `logos/${business.id}`);
      setFormData(prev => ({ ...prev, logoUrl: url }));
    } catch (err) {
      alert("Error al subir logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const compressed = await compressImage(file, 1400, 0.7);
      const url = await uploadImage(compressed, `covers/${business.id}`);
      
      const newCovers = [...(formData.coverPhotos || [])];
      if (newCovers.length > 0) {
        newCovers[0] = url;
      } else {
        newCovers.push(url);
      }
      
      setFormData(prev => ({ ...prev, coverPhotos: newCovers }));
    } catch (err) {
      alert("Error al subir banner");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(formData);
      alert('¡Identidad visual actualizada!');
    } catch (err) {
      alert('Error al guardar cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Identidad Visual</h1>
        <p className="text-gray-500 font-medium">Configura el logo y el banner principal de tu negocio.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Logo Section */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Logo del negocio</label>
                <div className="relative aspect-square w-40 rounded-3xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 group mx-auto md:mx-0">
                  {isUploadingLogo ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"><Loader2 className="animate-spin text-amber-500" /></div>
                  ) : formData.logoUrl && (
                    <>
                      <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                      <button type="button" onClick={() => setFormData(p => ({...p, logoUrl: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg z-20 hover:bg-red-600 transition-colors shadow-lg"><X size={16} /></button>
                    </>
                  )}
                  {!formData.logoUrl && (
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 transition-colors">
                      <Upload size={32} className="mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Subir Logo</span>
                    </button>
                  )}
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>
                <p className="text-[10px] text-gray-500 mt-4 text-center md:text-left">Se recomienda una imagen cuadrada (1:1) con fondo transparente o sólido.</p>
              </div>
            </div>

            {/* Banner Section */}
            <div className="space-y-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Banner de cabecera</label>
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 group">
                  {isUploadingBanner ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"><Loader2 className="animate-spin text-amber-500" /></div>
                  ) : formData.coverPhotos?.[0] && (
                    <>
                      <img src={formData.coverPhotos[0]} className="w-full h-full object-cover" alt="Banner" />
                      <button type="button" onClick={() => {
                        const newCovers = [...formData.coverPhotos];
                        newCovers[0] = '';
                        setFormData(p => ({...p, coverPhotos: newCovers}));
                      }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg z-20 hover:bg-red-600 transition-colors shadow-lg"><X size={16} /></button>
                    </>
                  )}
                  {!formData.coverPhotos?.[0] && (
                    <button type="button" onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 transition-colors">
                      <ImageIcon size={32} className="mb-2" /><span className="text-[10px] font-black uppercase tracking-widest">Subir Banner</span>
                    </button>
                  )}
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                </div>
                <p className="text-[10px] text-gray-500 mt-4">Esta es la imagen principal que verán los clientes al entrar a tu página.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isSaving || isUploadingLogo || isUploadingBanner}
            className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            Guardar Identidad
          </button>
        </div>
      </form>
    </div>
  );
};

export default OwnerIdentity;
