
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, ArrowRight, Loader2, Zap, Check, PlusCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { BusinessType, PlanType } from '../types';
import { CUBA_PROVINCES, CUBA_MUNICIPALITIES_BY_PROVINCE } from '../data';
import { supabase } from '../lib/supabase';

const Onboarding: React.FC<{ onComplete: (businessId: string) => Promise<void> }> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusText, setStatusText] = useState('Finalizar y Crear Menú');
  const [formData, setFormData] = useState({
    name: '',
    type: BusinessType.RESTAURANT,
    province: '',
    municipality: '',
    address: '',
    phone: '',
    password: '',
    description: ''
  });

  const municipalities = formData.province ? CUBA_MUNICIPALITIES_BY_PROVINCE[formData.province] || [] : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setStatusText('Creando perfil...');
    
    try {
      const businessId = Math.random().toString(36).substr(2, 9);
      
      const { error: bizError } = await supabase.from('businesses').insert({
        id: businessId,
        name: formData.name,
        type: formData.type,
        province: formData.province,
        municipality: formData.municipality,
        address: formData.address,
        phone: formData.phone,
        password: formData.password,
        description: formData.description,
        plan: PlanType.FREE,
        logo_url: 'https://via.placeholder.com/150',
        cover_photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200'],
        stats: { visits: 0, qrScans: 0, uniqueVisitors: 0 },
        is_visible: true,
        role: 'user',
        average_rating: 0,
        ratings_count: 0
      });

      if (bizError) {
        if (bizError.code === '23505') {
          throw new Error("Este número de teléfono ya está registrado.");
        }
        throw bizError;
      }

      setStatusText('Configurando categorías...');
      
      const { error: catError } = await supabase.from('categories').insert({
        id: Math.random().toString(36).substr(2, 9),
        businessId: businessId,
        name: 'General'
      });

      if (catError) throw catError;

      setStatusText('Iniciando sesión...');
      await onComplete(businessId);
      navigate('/admin', { replace: true });

    } catch (err: any) {
      console.error("Error en registro:", err);
      alert(err.message || "Error inesperado al crear perfil.");
      setIsSubmitting(false);
      setStatusText('Finalizar y Crear Menú');
    }
  };

  const freeFeatures = [
    "Perfil básico del negocio",
    "Hasta 10 productos",
    "Hasta 3 categorías",
    "QR básico (2 colores)",
    "Estadísticas básicas"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-amber-500/20">
            <Zap size={14} fill="currentColor" /> Empieza hoy mismo
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Crea tu menú digital</h1>
          <p className="text-gray-500 max-w-xl mx-auto font-medium">Registra tu negocio para acceder a tu panel de administración.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-[#141416] border border-white/5 p-8 rounded-3xl shadow-2xl space-y-6">
              <div className="space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                  <Store size={20} className="text-amber-500" /> Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Nombre del Negocio</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ej: El Rincón del Sabor"
                      className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none transition-all text-sm"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Tipo de Negocio</label>
                    <select 
                      className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none appearance-none cursor-pointer text-sm"
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value as BusinessType})}
                    >
                      {Object.values(BusinessType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                  <MapPin size={20} className="text-amber-500" /> Ubicación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Provincia</label>
                    <select 
                      required
                      className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none cursor-pointer text-sm"
                      value={formData.province}
                      onChange={e => setFormData({...formData, province: e.target.value})}
                    >
                      <option value="">Selecciona...</option>
                      {CUBA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Municipio (Localidad)</label>
                    <select 
                      required
                      disabled={!formData.province}
                      className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none disabled:opacity-50 cursor-pointer text-sm"
                      value={formData.municipality}
                      onChange={e => setFormData({...formData, municipality: e.target.value})}
                    >
                      <option value="">Selecciona...</option>
                      {municipalities.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                  <Lock size={20} className="text-amber-500" /> Seguridad y Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Teléfono (Usuario)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+53</span>
                      <input 
                        required
                        type="tel" 
                        placeholder="5XXXXXXX"
                        maxLength={8}
                        className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-3 pl-12 pr-4 text-white focus:border-amber-500/50 outline-none transition-all font-mono tracking-widest text-sm"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? "text" : "password"} 
                        placeholder="Mín. 6 caracteres"
                        className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 outline-none transition-all text-sm"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 mt-4 text-xs"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
                {statusText}
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <div className="bg-[#1a1a1c] border border-white/5 p-6 rounded-3xl">
              <h4 className="text-white font-bold text-sm uppercase mb-4">Plan Inicial</h4>
              <div className="flex items-center gap-3 text-amber-500 mb-6">
                <Check size={20} /> <span className="font-bold text-xl">GRATIS</span>
              </div>
              <ul className="space-y-3">
                {freeFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-400 text-xs font-medium">
                    <Check size={14} className="text-green-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
