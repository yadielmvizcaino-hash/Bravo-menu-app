
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Users, Package, Download, Crown, Info, ChevronRight, TrendingUp, Calendar, Zap, Layers, Image as ImageIcon, Settings, Shield, Star, Loader2, MousePointer2, QrCode, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Business, PlanType } from '../types';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';

const StatCard: React.FC<{ 
  label: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: string, 
  description?: string,
  trend?: string,
  data?: any[]
}> = ({ label, value, icon, color, description, trend, data }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="bg-[#0d0d0e] border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-5 shadow-2xl hover:border-amber-500/30 transition-all group relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/2 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-amber-500/5 transition-colors duration-700" />
    
    <div className="flex items-center justify-between relative z-10">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon as React.ReactElement, { size: 26 })}
      </div>
      {trend && (
        <div className="bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 backdrop-blur-md">
          <span className="text-green-500 text-[10px] font-black flex items-center gap-1.5 uppercase tracking-wider">
            <ArrowUpRight size={14} /> {trend}
          </span>
        </div>
      )}
    </div>
    
    <div className="relative z-10">
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-2 opacity-60 group-hover:opacity-100 transition-opacity">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-4xl font-black text-white leading-none tracking-tighter">{value}</h3>
        {description && <span className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">{description}</span>}
      </div>
    </div>

    {data && data.length > 0 && (
      <div className="h-16 w-full mt-2 opacity-20 group-hover:opacity-50 transition-opacity relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="currentColor" 
              fillOpacity={1} 
              fill={`url(#gradient-${label})`} 
              strokeWidth={3}
              className={color.split(' ')[1]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </motion.div>
);

const Dashboard: React.FC<{ business: Business, onUpdate?: (updated: Business) => void }> = ({ business, onUpdate }) => {
  const isPro = business.plan === PlanType.PRO;
  const isAdmin = business.role === 'admin';
  const [isDownloading, setIsDownloading] = useState(false);

  const isExpiredPro = useMemo(() => {
    if (business.plan !== PlanType.PRO) return false;
    if (!business.planExpiresAt) return false;
    return new Date(business.planExpiresAt) < new Date();
  }, [business]);

  const [showExpiredPopup, setShowExpiredPopup] = useState(isExpiredPro);
  const [isDowngrading, setIsDowngrading] = useState(false);

  const handleContinueFree = async () => {
    setIsDowngrading(true);
    try {
      const updatedBusiness = {
        ...business,
        plan: PlanType.FREE,
        planExpiresAt: null
      };

      const { error } = await supabase
        .from('businesses')
        .update({ plan: PlanType.FREE, plan_expires_at: null })
        .eq('id', business.id);

      if (error) throw error;

      if (onUpdate) onUpdate(updatedBusiness);
      setShowExpiredPopup(false);
    } catch (err) {
      console.error("Error downgrading plan:", err);
      alert("Error al actualizar el plan. Inténtalo de nuevo.");
    } finally {
      setIsDowngrading(false);
    }
  };

  // Generamos la URL pública precisa basada en la ubicación actual
  const businessUrl = `${window.location.href.split('#')[0]}#/negocio/${business.id}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(businessUrl)}`;

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${business.name.replace(/\s+/g, '-').toUpperCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error descargando QR:", error);
      alert("No se pudo descargar el QR. Inténtalo de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6 font-sans">
      {/* Modal de Plan Vencido */}
      {showExpiredPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500">
                <AlertCircle size={40} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">Tu Plan PRO ha vencido</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Las funciones premium (banners, eventos, envíos y menú ilimitado) han sido desactivadas.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-4">
                <Link 
                  to="/admin/pricing" 
                  onClick={() => setShowExpiredPopup(false)}
                  className="w-full bg-amber-500 text-black py-4 rounded-2xl font-extrabold uppercase text-[11px] tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all active:scale-95"
                >
                  <Zap size={16} fill="currentColor" />
                  Reactivar Plan PRO
                </Link>
                
                <button 
                  onClick={handleContinueFree}
                  disabled={isDowngrading}
                  className="w-full bg-white/5 text-gray-400 py-4 rounded-2xl font-extrabold uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                >
                  {isDowngrading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Continuar con Plan Gratis"}
                </button>
              </div>
              
              <p className="text-[10px] text-gray-600 font-medium uppercase tracking-widest">
                * El plan gratis limita tu menú a los primeros 10 productos.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight leading-tight">
            Hola, <span className="text-amber-500">{business.name}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide">Panel de control y estadísticas en tiempo real.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3 w-full md:w-auto"
        >
           <button className="flex-1 md:flex-none bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">
             <Calendar size={14} /> Historial
           </button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Estado del plan */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d0d0e] border border-white/5 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group hover:border-amber-500/30 transition-all"
        >
          <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-4 opacity-60">Plan Actual</p>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Crown size={28} fill="currentColor" />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">{isPro ? 'Plan PRO' : 'Plan Gratis'}</h3>
            </div>
          </div>
          <Link to="/admin/pricing" className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-center hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10">
            {isPro ? 'Gestionar Suscripción' : 'Mejorar a PRO'}
          </Link>
        </motion.div>

        {/* Calificación del Negocio */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0d0d0e] border border-white/5 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group hover:border-green-500/30 transition-all"
        >
          <div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-4 opacity-60">Calificación</p>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                <Star size={28} fill="currentColor" />
              </div>
              <h3 className="text-5xl font-black text-white tracking-tighter">{business.averageRating?.toFixed(1) || '0.0'}</h3>
            </div>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest ml-1">{business.ratingsCount || 0} Reseñas totales</p>
          </div>
          <div className="flex items-center gap-1 text-amber-500 mt-4">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={16} fill={s <= Math.round(business.averageRating || 0) ? "currentColor" : "none"} />
            ))}
          </div>
        </motion.div>

        {/* Código QR para Descargar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0d0d0e] border border-white/5 p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between group hover:border-blue-500/30 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.25em] mb-4 opacity-60">Código QR</p>
              <h3 className="text-xl font-black text-white tracking-tight leading-tight">Menú Digital<br/>Listo</h3>
            </div>
            <div className="bg-white p-2 rounded-2xl shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
              <img src={qrImageUrl} className="w-20 h-20" alt="QR" />
            </div>
          </div>
          <button 
            onClick={handleDownloadQR}
            disabled={isDownloading}
            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            Descargar QR
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
