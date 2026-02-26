
import React, { useState, useRef, useEffect } from 'react';
import { Save, Store, MapPin, Phone, MessageSquare, Info, Loader2, X, Plus, Clock, Instagram, Facebook, Mail, Crown, Copy, Truck, ChevronDown, Upload, Image as ImageIcon, Camera, Palette, Trash2, AlertTriangle } from 'lucide-react';
import { Business, BusinessType, PlanType } from '../types';
import { compressImage } from '../utils/image';
import { uploadImage } from '../lib/supabase';
import { CUBA_PROVINCES, CUBA_MUNICIPALITIES_BY_PROVINCE } from '../data';

interface DayConfig {
  open: boolean;
  from: string;
  to: string;
}

const DEFAULT_SCHEDULE: Record<string, DayConfig> = {
  'Lunes': { open: false, from: '09:00', to: '22:00' },
  'Martes': { open: true, from: '09:00', to: '22:00' },
  'Miércoles': { open: true, from: '09:00', to: '22:00' },
  'Jueves': { open: true, from: '09:00', to: '22:00' },
  'Viernes': { open: true, from: '09:00', to: '23:30' },
  'Sábado': { open: true, from: '10:00', to: '23:30' },
  'Domingo': { open: true, from: '10:00', to: '23:30' },
};

const timeOptions = Array.from({ length: 48 }).map((_, i) => {
  const hours = Math.floor(i / 2).toString().padStart(2, '0');
  const mins = i % 2 === 0 ? '00' : '30';
  return `${hours}:${mins}`;
});

const getInitialSchedule = (schedule: any) => {
  let parsedSchedule = schedule;
  if (typeof schedule === 'string') {
    try {
      parsedSchedule = JSON.parse(schedule);
    } catch (e) {
      return DEFAULT_SCHEDULE;
    }
  }

  if (!parsedSchedule || typeof parsedSchedule !== 'object' || Array.isArray(parsedSchedule) || Object.keys(parsedSchedule).length === 0) {
    return DEFAULT_SCHEDULE;
  }
  
  const merged: Record<string, DayConfig> = { ...DEFAULT_SCHEDULE };
  for (const day of Object.keys(DEFAULT_SCHEDULE)) {
    if (parsedSchedule[day]) {
      merged[day] = parsedSchedule[day];
    }
  }
  return merged;
};

const OwnerSettings: React.FC<{ business: Business, onUpdate: (b: Business) => void, onDelete: () => Promise<void> }> = ({ business, onUpdate, onDelete }) => {
  const [formData, setFormData] = useState(() => ({ 
    ...business,
    whatsapp: business.whatsapp || business.phone || '',
    email: business.email || '',
    instagram: business.instagram || '',
    facebook: business.facebook || '',
    cuisineTypes: business.cuisineTypes || ['Comida', 'Bebida'],
    schedule: getInitialSchedule(business.schedule),
    deliveryEnabled: business.deliveryEnabled ?? false,
    deliveryPriceInside: business.deliveryPriceInside || 0,
    deliveryPriceOutside: business.deliveryPriceOutside || 0
  }));

  useEffect(() => {
    if (business) {
      setFormData(prev => ({
        ...prev,
        ...business,
        schedule: getInitialSchedule(business.schedule)
      }));
    }
  }, [business.id]); // Only reset if business ID changes
  
  const [newCuisine, setNewCuisine] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const addCuisine = () => {
    if (newCuisine.trim() && !formData.cuisineTypes?.includes(newCuisine.trim())) {
      setFormData(prev => ({
        ...prev,
        cuisineTypes: [...(prev.cuisineTypes || []), newCuisine.trim()]
      }));
      setNewCuisine('');
    }
  };

  const removeCuisine = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      cuisineTypes: prev.cuisineTypes?.filter(t => t !== tag) || []
    }));
  };

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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const maxPhotos = business.plan === PlanType.PRO ? 10 : 1;
    const currentPhotos = formData.coverPhotos || [];
    
    if (currentPhotos.length >= maxPhotos) {
      alert(`Tu plan actual (${business.plan}) solo permite hasta ${maxPhotos} fotos en la galería.`);
      return;
    }

    setIsUploadingCover(true);
    try {
      const file = files[0];
      const compressed = await compressImage(file, 1400, 0.7);
      const url = await uploadImage(compressed, `covers/${business.id}`);
      setFormData(prev => ({ ...prev, coverPhotos: [...(prev.coverPhotos || []), url] }));
    } catch (err) {
      alert("Error al subir imagen");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const removeCoverPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      coverPhotos: (prev.coverPhotos || []).filter((_, i) => i !== index)
    }));
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      alert("Error al eliminar el negocio.");
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdate(formData);
      alert('¡Perfil actualizado correctamente!');
    } catch (err) {
      alert('Error al guardar cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const municipalities = formData.province ? CUBA_MUNICIPALITIES_BY_PROVINCE[formData.province] || [] : [];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Editar perfil</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-white font-bold text-base mb-6 uppercase tracking-tight">Información básica</h3>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nombre del negocio *</label>
              <input 
                required
                type="text" 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Descripción</label>
              <textarea 
                rows={3} 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white resize-none focus:border-amber-500/50 outline-none text-sm font-medium"
                placeholder="Escribe una breve descripción de tu negocio..."
                value={formData.description || ''}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de negocio *</label>
                <select 
                  required
                  className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none appearance-none text-sm font-medium cursor-pointer"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value as BusinessType})}
                >
                  {Object.values(BusinessType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Tipos de cocina</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-[#242426] border border-gray-700 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none text-sm font-medium"
                      placeholder="Ej: Cubana, Internacional..."
                      value={newCuisine}
                      onChange={e => setNewCuisine(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCuisine())}
                    />
                    <button 
                      type="button"
                      onClick={addCuisine}
                      className="bg-[#242426] border border-gray-700 text-gray-400 p-3 rounded-xl hover:text-white transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.cuisineTypes?.map(tag => (
                    <span key={tag} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2">
                      {tag}
                      <button type="button" onClick={() => removeCuisine(tag)} className="hover:text-amber-400"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Identidad Visual */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 uppercase tracking-tight"><Palette size={18} className="text-amber-500" /> Identidad Visual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Logo del negocio</label>
              <div className="relative aspect-square w-32 rounded-2xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 group">
                {isUploadingLogo ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"><Loader2 className="animate-spin text-amber-500" /></div>
                ) : formData.logoUrl && (
                  <>
                    <img src={formData.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                    <button type="button" onClick={() => setFormData(p => ({...p, logoUrl: ''}))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-md z-20 hover:bg-red-600 transition-colors shadow-lg"><X size={14} /></button>
                  </>
                )}
                {!formData.logoUrl && (
                  <button type="button" onClick={() => logoInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 transition-colors">
                    <Upload size={20} className="mb-1" /><span className="text-[10px] font-bold uppercase tracking-widest">Subir</span>
                  </button>
                )}
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Se recomienda una imagen cuadrada (1:1).</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Banner Principal (Cabecera)</label>
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 group">
                {isUploadingCover && (formData.coverPhotos?.length || 0) === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10"><Loader2 className="animate-spin text-amber-500" /></div>
                ) : formData.coverPhotos?.[0] ? (
                  <>
                    <img src={formData.coverPhotos[0]} className="w-full h-full object-cover" alt="Banner" />
                    <button type="button" onClick={() => removeCoverPhoto(0)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-md z-20 hover:bg-red-600 transition-colors shadow-lg"><X size={14} /></button>
                  </>
                ) : (
                  <button type="button" onClick={() => coverInputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 transition-colors">
                    <ImageIcon size={20} className="mb-1" /><span className="text-[10px] font-bold uppercase tracking-widest">Subir Banner</span>
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-500">Esta es la primera foto que verán tus clientes.</p>
            </div>
          </div>
        </section>

        {/* Galería de fotos */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 uppercase tracking-tight"><Camera size={18} className="text-amber-500" /> Galería de fotos</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Fotos adicionales ({formData.coverPhotos?.length || 0}/{business.plan === PlanType.PRO ? 10 : 1})</label>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(formData.coverPhotos || []).map((url, index) => (
                index > 0 && (
                  <div key={index} className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden group border border-gray-800">
                    <img src={url} className="w-full h-full object-cover" alt={`Foto ${index + 1}`} />
                    <button 
                      type="button" 
                      onClick={() => removeCoverPhoto(index)} 
                      className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              ))}
              
              {(formData.coverPhotos?.length || 0) < (business.plan === PlanType.PRO ? 10 : 1) && (
                <button 
                  type="button" 
                  onClick={() => coverInputRef.current?.click()} 
                  className="aspect-video sm:aspect-square rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 hover:border-amber-500/50 transition-all"
                >
                  {isUploadingCover ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={24} className="mb-1" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Añadir</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
            <p className="text-[10px] text-gray-500">Añade más fotos de tu local, platos o ambiente.</p>
          </div>
        </section>

        {/* Ubicación */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 uppercase tracking-tight"><MapPin size={18} className="text-amber-500" /> Ubicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Provincia *</label>
              <select 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none appearance-none text-sm font-medium cursor-pointer"
                value={formData.province || ''}
                onChange={e => setFormData({...formData, province: e.target.value})}
              >
                <option value="">Selecciona...</option>
                {CUBA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Municipio *</label>
              <select 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none appearance-none disabled:opacity-50 text-sm font-medium cursor-pointer"
                disabled={!formData.province}
                value={formData.municipality || ''}
                onChange={e => setFormData({...formData, municipality: e.target.value})}
              >
                <option value="">Seleccionar</option>
                {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Dirección completa</label>
            <input 
              type="text" 
              className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              placeholder="Ej: Calle 23 e/ L y M, Vedado"
              value={formData.address || ''}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </section>

        {/* Contacto */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-white font-bold text-base mb-6 flex items-center gap-2 uppercase tracking-tight"><Phone size={18} className="text-amber-500" /> Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Teléfono</label>
              <input 
                type="text" 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">WhatsApp</label>
              <input 
                type="text" 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                value={formData.whatsapp || ''}
                onChange={e => setFormData({...formData, whatsapp: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email</label>
              <input 
                type="email" 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                value={formData.email || ''}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instagram</label>
              <input 
                type="text" 
                className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                placeholder="@minegocio"
                value={formData.instagram || ''}
                onChange={e => setFormData({...formData, instagram: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Facebook</label>
            <input 
              type="text" 
              className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              placeholder="https://facebook.com/minegocio"
              value={formData.facebook || ''}
              onChange={e => setFormData({...formData, facebook: e.target.value})}
            />
          </div>
        </section>

        {/* Horarios de Atención */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 mb-8">
            <Clock size={20} className="text-amber-500" />
            <h3 className="text-white font-bold text-lg tracking-tight uppercase">Horario de atención</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(formData.schedule || DEFAULT_SCHEDULE).map(([day, config]) => (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-3 border-b border-gray-800/50 last:border-0">
                <div className="flex items-center justify-between sm:w-44">
                  <span className="text-sm font-bold text-gray-300 capitalize">{day}</span>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        const newSchedule = { ...formData.schedule };
                        newSchedule[day] = { ...config, open: !config.open };
                        setFormData({ ...formData, schedule: newSchedule });
                      }}
                      className={`w-10 h-5 rounded-full relative transition-all duration-300 ${config.open ? 'bg-amber-500' : 'bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${config.open ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className={`text-[10px] font-black uppercase tracking-widest w-12 ${config.open ? 'text-amber-500' : 'text-gray-500'}`}>
                      {config.open ? 'Abierto' : 'Cerrado'}
                    </span>
                  </div>
                </div>

                {config.open && (
                  <div className="flex items-center gap-2 sm:gap-3 ml-0 sm:ml-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <select 
                        className="w-full bg-[#242426] border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-xs text-white outline-none focus:border-amber-500/50 appearance-none font-bold"
                        value={config.from}
                        onChange={e => {
                          const newSchedule = { ...formData.schedule };
                          newSchedule[day] = { ...config, from: e.target.value };
                          setFormData({ ...formData, schedule: newSchedule });
                        }}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <span className="text-gray-600 text-xs font-bold">a</span>
                    <div className="relative flex-1 sm:flex-none">
                      <select 
                        className="w-full bg-[#242426] border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-xs text-white outline-none focus:border-amber-500/50 appearance-none font-bold"
                        value={config.to}
                        onChange={e => {
                          const newSchedule = { ...formData.schedule };
                          newSchedule[day] = { ...config, to: e.target.value };
                          setFormData({ ...formData, schedule: newSchedule });
                        }}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pedidos a domicilio */}
        <section className="bg-[#141416] border border-white/5 rounded-3xl p-8 shadow-xl space-y-8 relative">
          <div className="absolute top-8 right-8">
            <button 
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, deliveryEnabled: !prev.deliveryEnabled }))}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formData.deliveryEnabled ? 'bg-amber-500' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${formData.deliveryEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-bold text-xl tracking-tight uppercase">Pedidos a domicilio</h3>
            <p className="text-gray-500 text-[10px] font-medium leading-relaxed max-w-md uppercase tracking-widest">
              Activa esta opción para permitir que los clientes realicen pedidos por WhatsApp directamente desde tu menú.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-6">
            <h4 className="font-bold text-xs text-white uppercase tracking-widest">Configuración de precios de envío</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Precio dentro de tu municipio (CUP)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-bold"
                  value={formData.deliveryPriceInside}
                  onChange={e => setFormData({...formData, deliveryPriceInside: parseFloat(e.target.value) || 0})}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Precio fuera de tu municipio (CUP)
                </label>
                <input 
                  type="number" 
                  className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none transition-all text-sm font-bold"
                  value={formData.deliveryPriceOutside}
                  onChange={e => setFormData({...formData, deliveryPriceOutside: parseFloat(e.target.value) || 0})}
                  placeholder="500"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            Guardar cambios
          </button>
        </div>

        {/* Zona de Peligro */}
        <section className="mt-12 pt-12 border-t border-red-500/20">
          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-black uppercase tracking-tight">Zona de Peligro</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 font-medium">
              Al eliminar tu negocio, se borrarán permanentemente todos tus productos, categorías, eventos y banners. Esta acción no se puede deshacer.
            </p>
            <button 
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Trash2 size={16} /> Eliminar mi negocio permanentemente
            </button>
          </div>
        </section>
      </form>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1a1a1c] border border-red-500/30 rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-black text-white text-center mb-4 uppercase tracking-tight">¿Estás seguro?</h2>
            <p className="text-gray-400 text-center mb-8 font-medium">
              Esta acción eliminará <span className="text-white font-bold">{business.name}</span> y todos sus datos para siempre. No podrás recuperar esta información.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                Sí, eliminar definitivamente
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full bg-white/5 text-gray-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerSettings;
