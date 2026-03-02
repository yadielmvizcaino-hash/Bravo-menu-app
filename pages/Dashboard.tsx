
import React, { useEffect, useState, useMemo } from 'react';
import { Eye, Users, Package, Download, Crown, Info, ChevronRight, TrendingUp, Calendar, Zap, Layers, Image as ImageIcon, Settings, Shield, Star, Loader2, MousePointer2, QrCode } from 'lucide-react';
import { Business, PlanType } from '../types';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { supabase } from '../lib/supabase';

const StatCard: React.FC<{ 
  label: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: string, 
  trend?: string,
  data?: any[]
}> = ({ label, value, icon, color, trend, data }) => (
  <div className="bg-[#0a0a0b] border border-white/5 p-4 rounded-2xl flex flex-col gap-3 shadow-xl hover:border-white/10 transition-all group">
    <div className="flex items-center justify-between">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
        {React.cloneElement(icon as React.ReactElement, { size: 18 })}
      </div>
      {trend && (
        <div className="flex flex-col items-end">
          <span className="text-green-500 text-[10px] font-black flex items-center gap-0.5">
            <TrendingUp size={10} /> {trend}
          </span>
        </div>
      )}
    </div>
    
    <div>
      <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.15em] mb-0.5">{label}</p>
      <h3 className="text-2xl font-black text-white leading-none tracking-tighter">{value}</h3>
    </div>

    {data && data.length > 0 && (
      <div className="h-8 w-full mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="currentColor" 
              fillOpacity={0.1} 
              fill="currentColor" 
              strokeWidth={1.5}
              className={color.split(' ')[1]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

const Dashboard: React.FC<{ business: Business }> = ({ business }) => {
  const isPro = business.plan === PlanType.PRO;
  const isAdmin = business.role === 'admin';
  const [isDownloading, setIsDownloading] = useState(false);
  const [visitsHistory, setVisitsHistory] = useState<{ name: string, value: number }[]>([]);
  const [totalVisits, setTotalVisits] = useState(business.stats.visits);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener historial de visitas de los últimos 7 días
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateStr = sevenDaysAgo.toISOString().split('T')[0];

        const { data, error } = await supabase
          .from('business_visits')
          .select('visit_date, visit_count')
          .eq('business_id', business.id)
          .gte('visit_date', dateStr)
          .order('visit_date', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const history = data.map(d => ({
            name: d.visit_date.split('-')[2], // Solo el día
            value: d.visit_count
          }));
          setVisitsHistory(history);
          
          // Calcular total real de visitas (suma de todo el historial o usar el contador del negocio)
          // Por ahora sumamos lo que tenemos en el historial para mostrar algo real
          const sum = data.reduce((acc, curr) => acc + curr.visit_count, 0);
          setTotalVisits(sum);
        } else {
          // Si no hay datos, mostrar ceros o datos de ejemplo si se prefiere
          setVisitsHistory([]);
          setTotalVisits(0);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [business.id]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white mb-1 tracking-tighter">Hola, {business.name} 👋</h1>
          <p className="text-gray-500 text-xs font-medium">Panel de control y estadísticas en tiempo real.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
           <button className="flex-1 md:flex-none bg-white/5 border border-white/10 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
             <Calendar size={12} /> Historial
           </button>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard 
          label="Visitas Reales" 
          value={isLoadingStats ? '...' : totalVisits} 
          icon={<Eye />} 
          color="bg-blue-500/10 text-blue-500" 
          trend={visitsHistory.length > 0 ? "Activo" : "Sin datos"} 
          data={visitsHistory}
        />
        <StatCard 
          label="Calificación" 
          value={business.averageRating?.toFixed(1) || '0.0'} 
          icon={<Star />} 
          color="bg-amber-500/10 text-amber-500" 
          trend={business.ratingsCount ? `${business.ratingsCount} votos` : 'Sin votos'} 
        />
        <StatCard 
          label="Productos" 
          value={business.products.length} 
          icon={<Package />} 
          color="bg-purple-500/10 text-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 space-y-6">
          {/* Accesos Rápidos Rediseñados - Compactos */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-tight">Accesos rápidos</h2>
              <Zap size={14} className="text-amber-500" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
               {[
                 { label: 'Productos', icon: <Package size={18} />, to: '/admin/menu', color: 'bg-amber-500/10 text-amber-500' },
                 { label: 'Banners', icon: <ImageIcon size={18} />, to: '/admin/banners', color: 'bg-purple-500/10 text-purple-500' },
                 { label: 'Eventos', icon: <Calendar size={18} />, to: '/admin/events', color: 'bg-green-500/10 text-green-500' },
                 { label: 'QR Menú', icon: <QrCode size={18} />, to: '#', color: 'bg-orange-500/10 text-orange-500' },
                 { label: isAdmin ? 'Súper Admin' : 'Configuración', icon: isAdmin ? <Shield size={18} /> : <Settings size={18} />, to: isAdmin ? '/super-admin' : '/admin/pricing', color: 'bg-gray-500/10 text-gray-400' },
               ].map((item, idx) => (
                 <Link key={idx} to={item.to} className="flex items-center gap-3 p-3 rounded-2xl bg-black border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                      {item.icon}
                    </div>
                    <span className="text-white font-black text-[9px] uppercase tracking-widest">{item.label}</span>
                 </Link>
               ))}
            </div>
          </div>

          {/* Diseñador de QR - Compacto */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-tight">Diseñador de QR</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="bg-white p-3 rounded-2xl shrink-0">
                <img src={qrImageUrl} className="w-20 h-20" alt="QR" />
              </div>
              <div className="flex-1 space-y-4">
                 <p className="text-gray-500 text-[11px] leading-relaxed font-medium">Tu acceso directo al menú. Descárgalo e imprímelo para tus mesas.</p>
                 <button 
                   onClick={handleDownloadQR}
                   disabled={isDownloading}
                   className="w-full bg-white text-black py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-500 transition-all disabled:opacity-50"
                 >
                   {isDownloading ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} 
                   Descargar QR
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Tarjeta de Plan - Compacta */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Crown size={20} fill="currentColor" />
              </div>
              <span className="bg-amber-500 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                {isPro ? 'PRO' : 'Gratis'}
              </span>
            </div>
            <h3 className="text-white font-black text-base mb-1 tracking-tight">Suscripción</h3>
            <p className="text-gray-500 text-[10px] font-medium mb-6 leading-relaxed">
              {isPro ? 'Acceso total a funciones premium.' : 'Plan básico. Actualiza para más.'}
            </p>
            <Link to="/admin/pricing" className="block w-full text-center bg-white text-black py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-500 transition-all">
              {isPro ? 'Gestionar' : 'Mejorar'}
            </Link>
          </div>

          {/* Tarjeta de Reputación - Compacta */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-3xl p-6 shadow-xl">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black text-white uppercase tracking-tight">Reputación</h3>
               <Star size={16} className="text-amber-500" />
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Promedio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-2xl tracking-tighter">{business.averageRating?.toFixed(1) || '0.0'}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} fill={s <= Math.round(business.averageRating || 0) ? "currentColor" : "none"} />)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">Satisfacción</span>
                    <span className="text-white">{Math.round((business.averageRating || 0) * 20)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${(business.averageRating || 0) * 20}%` }} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Total votos</span>
                  <span className="text-white font-black text-xs">{business.ratingsCount || 0}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
