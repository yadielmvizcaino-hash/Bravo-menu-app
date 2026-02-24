
import React, { useState, useRef } from 'react';
import { Plus, Info, Crown, Edit2, Trash2, GripVertical, Link as LinkIcon, Eye, Image as ImageIcon, X, Save, Upload, Loader2, ChevronRight } from 'lucide-react';
import { Business, PlanType, Banner } from '../types.ts';
import { Link } from 'react-router-dom';
import { compressImage } from '../utils/image.ts';
import { supabase, uploadImage } from '../lib/supabase.ts';
import OptimizedImage from '../components/OptimizedImage.tsx';

const OwnerBanners: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '#',
    position: 'header' as 'header' | 'middle' | 'footer'
  });

  const isPro = business.plan === PlanType.PRO;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 0.7);
      const url = await uploadImage(compressed, `banners/${business.id}`);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      alert('Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert('Sube una imagen');
    setIsSaving(true);
    try {
      const bannerData = {
        id: editingBanner?.id || Math.random().toString(36).substr(2, 9),
        businessId: business.id,
        ...formData,
        clicks: editingBanner?.clicks || 0
      };
      const { error } = await supabase.from('banners').upsert(bannerData);
      if (error) throw error;

      let updatedBanners = editingBanner 
        ? business.banners.map(b => b.id === editingBanner.id ? (bannerData as Banner) : b)
        : [...business.banners, bannerData as Banner];
      
      onUpdate({ ...business, banners: updatedBanners });
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar banner definitivamente?')) {
      setIsDeleting(id);
      try {
        const { error } = await supabase.from('banners').delete().eq('id', id);
        if (error) throw error;
        
        const updatedBanners = business.banners.filter(b => b.id !== id);
        onUpdate({ ...business, banners: updatedBanners });
      } catch (err) {
        alert('No se pudo eliminar el banner');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const openCreateModal = () => {
    setEditingBanner(null);
    setFormData({ title: '', imageUrl: '', linkUrl: '#', position: 'header' });
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({ title: banner.title || '', imageUrl: banner.imageUrl, linkUrl: banner.linkUrl, position: banner.position });
    setIsModalOpen(true);
  };

  if (!isPro) {
    return (
      <div className="max-w-4xl mx-auto h-[80vh] flex items-center justify-center px-6">
        <div className="relative bg-[#1a1a1c] border border-white/5 rounded-3xl p-12 text-center overflow-hidden shadow-2xl">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-amber-500 text-black rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Crown size={48} fill="currentColor" />
            </div>
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">Publicidad PRO</h1>
            <p className="text-gray-400 text-lg max-w-sm mx-auto mb-10 leading-relaxed">Destaca ofertas y novedades con banners visuales en el menú. Función exclusiva del Plan PRO.</p>
            <Link to="/admin/pricing" className="inline-flex items-center gap-3 bg-amber-500 text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl">Actualizar a PRO <ChevronRight size={20} /></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase">Publicidad</h1>
          <p className="text-gray-500 font-medium">{business.banners.length} banners activos</p>
        </div>
        <button onClick={openCreateModal} className="w-full md:w-auto bg-amber-500 text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-amber-400 transition-all">
          <Plus size={20} strokeWidth={3} /> Añadir Banner
        </button>
      </div>

      <div className="space-y-6">
        {business.banners.map(banner => (
          <div key={banner.id} className="bg-[#1a1a1c] border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-amber-500/30 transition-all shadow-xl">
             <div className="w-full md:w-64 h-36 rounded-2xl overflow-hidden shrink-0">
               <OptimizedImage src={banner.imageUrl} containerClassName="w-full h-full" alt="Banner" />
             </div>
             <div className="flex-1 w-full overflow-hidden">
               <h3 className="text-white font-bold text-lg mb-2 uppercase tracking-tight truncate">{banner.title || 'Oferta'}</h3>
               <div className="flex flex-wrap gap-4 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                 <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-lg border border-amber-500/20">{banner.position}</span>
                 <span className="flex items-center gap-2"><Eye size={14} /> {banner.clicks} clics</span>
               </div>
             </div>
             <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => openEditModal(banner)} className="p-4 bg-gray-800 text-gray-400 rounded-2xl hover:text-white transition-all shadow-xl"><Edit2 size={20} /></button>
                <button 
                  onClick={() => handleDelete(banner.id)} 
                  disabled={isDeleting === banner.id}
                  className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl disabled:opacity-50"
                >
                  {isDeleting === banner.id ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
                </button>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1a1a1c] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">{editingBanner ? 'Editar' : 'Nuevo'} Banner</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Imagen (Recomendado Horizontal)</label>
                <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-52 rounded-2xl overflow-hidden bg-black/40 border-2 border-dashed border-white/10 flex items-center justify-center group cursor-pointer hover:border-amber-500/50 transition-all">
                  {isUploading ? (
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto text-gray-700 mb-3" size={40} />
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Subir Imagen</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black uppercase tracking-widest">Cambiar</div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Título</label>
                  <input required type="text" className="w-full bg-[#242426] border border-white/5 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm font-bold uppercase" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Posición</label>
                  <select className="w-full bg-[#242426] border border-white/5 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm appearance-none" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value as any})}>
                    <option value="header">Superior (Header)</option>
                    <option value="middle">Intermedio (Middle)</option>
                    <option value="footer">Inferior (Footer)</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={isSaving || isUploading} className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-2xl disabled:opacity-50 text-xs uppercase tracking-widest">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Publicar Banner
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerBanners;
