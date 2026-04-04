
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
    <div className="max-w-7xl mx-auto pb-10 px-4 md:px-0">
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

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <StatCard 
          label="Escaneos QR" 
          value={business.stats.qrScans || 0} 
          icon={<QrCode />} 
          color="bg-amber-500/10 text-amber-500" 
          description="Totales"
          trend="+12%" 
        />
        <StatCard 
          label="Visitantes Únicos" 
          value={business.stats.uniqueVisitors || 0} 
          icon={<Users />} 
          color="bg-blue-500/10 text-blue-500" 
          description="Personas"
          trend="Estable"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Diseñador de QR - Refinado */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0d0d0e] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-3">
                <QrCode size={20} className="text-amber-500" />
                Diseñador de QR
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-10 relative z-10">
              <div className="bg-white p-5 rounded-[2rem] shrink-0 shadow-2xl rotate-[-2deg] group-hover:rotate-0 transition-transform duration-500">
                <img src={qrImageUrl} className="w-32 h-32" alt="QR" />
              </div>
              <div className="flex-1 space-y-6 text-center sm:text-left">
                 <div className="space-y-2">
                   <p className="text-white font-bold text-lg leading-tight">Tu acceso directo al menú.</p>
                   <p className="text-gray-500 text-sm leading-relaxed font-medium">Descárgalo e imprímelo para tus mesas. Los clientes podrán ver tu menú al instante.</p>
                 </div>
                 <button 
                   onClick={handleDownloadQR}
                   disabled={isDownloading}
                   className="w-full sm:w-auto bg-amber-500 text-black px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                 >
                   {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
                   Descargar Código QR
                 </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-8">
          {/* Tarjeta de Plan - Refinada */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0d0d0e] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
                <Crown size={28} fill="currentColor" />
              </div>
              <span className="bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] shadow-lg">
                {isPro ? 'PRO' : 'Gratis'}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-white font-black text-xl mb-2 tracking-tight">Suscripción</h3>
              <p className="text-gray-500 text-xs font-medium mb-8 leading-relaxed opacity-80">
                {isPro ? 'Disfrutas de todas las funciones premium activas.' : 'Plan básico limitado. Actualiza para desbloquear todo el potencial.'}
              </p>
              <Link to="/admin/pricing" className="block w-full text-center bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-xl active:scale-95">
                {isPro ? 'Gestionar Plan' : 'Mejorar ahora'}
              </Link>
            </div>
          </motion.div>

          {/* Tarjeta de Reputación - Refinada */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0d0d0e] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
          >
             <div className="flex items-center justify-between mb-8 relative z-10">
               <h3 className="text-sm font-black text-white uppercase tracking-[0.15em] flex items-center gap-2">
                 <Star size={18} className="text-amber-500" fill="currentColor" />
                 Reputación
               </h3>
             </div>
             
             <div className="space-y-6 relative z-10">
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest opacity-60">Promedio General</p>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-black text-4xl tracking-tighter leading-none">{business.averageRating?.toFixed(1) || '0.0'}</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= Math.round(business.averageRating || 0) ? "currentColor" : "none"} />)}
                        </div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{business.ratingsCount || 0} opiniones</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.15em]">
                    <span className="text-gray-500">Nivel de Satisfacción</span>
                    <span className="text-amber-500">{Math.round((business.averageRating || 0) * 20)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(business.averageRating || 0) * 20}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-500">
                    <TrendingUp size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">En crecimiento</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-700" />
                </div>
             </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
