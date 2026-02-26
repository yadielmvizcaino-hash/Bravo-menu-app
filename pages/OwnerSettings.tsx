
import React, { useState, useRef, useEffect } from 'react';
import { Save, Upload, Image as ImageIcon, Store, MapPin, Phone, MessageSquare, Info, Loader2, X, Plus, Clock, Instagram, Facebook, Mail, Crown, Copy, Truck, ChevronDown } from 'lucide-react';
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

const OwnerSettings: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm font-medium"
                    placeholder="Ej: Cubana, Internacional..."
                    value={newCuisine}
                    onChange={e => setNewCuisine(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCuisine())}
                  />
                  <button 
                    type="button"
                    onClick={addCuisine}
                    className="bg-[#242426] border border-gray-700 text-gray-400 p-4 rounded-xl hover:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
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

        {/* Imágenes */}
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-white font-bold text-base mb-6 uppercase tracking-tight">Imágenes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Logo</label>
              <div className="relative aspect-square max-w-[200px] rounded-2xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 group">
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
                    <Upload size={24} className="mb-2" /><span className="text-xs font-bold uppercase tracking-widest">Subir</span>
                  </button>
                )}
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Galería de fotos ({formData.coverPhotos?.length || 0}/{business.plan === PlanType.PRO ? 10 : 1})</label>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(formData.coverPhotos || []).map((url, index) => (
                  <div key={index} className="relative h-32 rounded-xl overflow-hidden group border border-gray-800">
                    <img src={url} className="w-full h-full object-cover" alt={`Foto ${index + 1}`} />
                    <button 
                      type="button" 
                      onClick={() => removeCoverPhoto(index)} 
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                {(formData.coverPhotos?.length || 0) < (business.plan === PlanType.PRO ? 10 : 1) && (
                  <button 
                    type="button" 
                    onClick={() => coverInputRef.current?.click()} 
                    className="h-32 rounded-xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-600 hover:text-amber-500 hover:border-amber-500/50 transition-all"
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
            </div>
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
        <section className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-8">
            <Clock size={20} className="text-amber-500" />
            <h3 className="text-white font-bold text-lg tracking-tight">Horario</h3>
          </div>
          
          <div className="space-y-4">
            {Object.entries(formData.schedule || DEFAULT_SCHEDULE).map(([day, config]) => (
              <div key={day} className="flex items-center gap-4 py-1">
                <span className="text-[14px] text-gray-300 w-24 capitalize">{day}</span>
                
                <div className="flex items-center gap-3 w-28">
                  <button 
                    type="button"
                    onClick={() => {
                      const newSchedule = { ...formData.schedule };
                      newSchedule[day] = { ...config, open: !config.open };
                      setFormData({ ...formData, schedule: newSchedule });
                    }}
                    className="w-11 h-6 rounded-full relative transition-all duration-300 bg-white"
                  >
                    <div className={`absolute top-[3px] w-4.5 h-4.5 rounded-full transition-all shadow-sm ${config.open ? 'bg-black left-[22px]' : 'bg-gray-300 left-[3px]'}`} />
                  </button>
                  <span className="text-[13px] text-gray-500">
                    {config.open ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>

                {config.open && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select 
                        className="bg-[#242426] border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-[14px] text-white outline-none focus:border-amber-500/50 appearance-none font-medium min-w-[100px]"
                        value={config.from}
                        onChange={e => {
                          const newSchedule = { ...formData.schedule };
                          newSchedule[day] = { ...config, from: e.target.value };
                          setFormData({ ...formData, schedule: newSchedule });
                        }}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                    <span className="text-gray-600">-</span>
                    <div className="relative">
                      <select 
                        className="bg-[#242426] border border-gray-700 rounded-lg pl-4 pr-10 py-2.5 text-[14px] text-white outline-none focus:border-amber-500/50 appearance-none font-medium min-w-[100px]"
                        value={config.to}
                        onChange={e => {
                          const newSchedule = { ...formData.schedule };
                          newSchedule[day] = { ...config, to: e.target.value };
                          setFormData({ ...formData, schedule: newSchedule });
                        }}
                      >
                        {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
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
      </form>
    </div>
  );
};

export default OwnerSettings;
