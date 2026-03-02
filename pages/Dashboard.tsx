
import React from 'react';
import { Eye, Users, Package, Download, Crown, Info, ChevronRight, TrendingUp, Calendar, Zap, Layers, Image as ImageIcon, Settings, Shield, Star, Loader2, MousePointer2 } from 'lucide-react';
import { Business, PlanType } from '../types';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

// Datos simulados para los gráficos de tendencia
const generateTrendData = (base: number) => {
  return Array.from({ length: 7 }, (_, i) => ({
    name: `Día ${i + 1}`,
    value: Math.floor(base * (0.8 + Math.random() * 0.4))
  }));
};

const StatCard: React.FC<{ 
  label: string, 
  value: string | number, 
  icon: React.ReactNode, 
  color: string, 
  trend?: string,
  data?: any[]
}> = ({ label, value, icon, color, trend, data }) => (
  <div className="bg-[#0a0a0b] border border-white/5 p-5 rounded-[2rem] flex flex-col gap-4 shadow-2xl hover:border-white/10 transition-all group">
    <div className="flex items-center justify-between">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500`}>
        {icon}
      </div>
      {trend && (
        <div className="flex flex-col items-end">
          <span className="text-green-500 text-xs font-black flex items-center gap-0.5">
            <TrendingUp size={12} /> {trend}
          </span>
          <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Últimos 7 días</span>
        </div>
      )}
    </div>
    
    <div className="flex-1">
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-3xl font-black text-white leading-none tracking-tighter">{value}</h3>
    </div>

    {data && (
      <div className="h-12 w-full mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="currentColor" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="currentColor" 
              fillOpacity={1} 
              fill={`url(#gradient-${label})`} 
              strokeWidth={2}
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
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Datos para los gráficos
  const visitsData = React.useMemo(() => generateTrendData(business.stats.visits / 7), [business.stats.visits]);
  const leadsData = React.useMemo(() => generateTrendData(business.leads.length / 7), [business.leads.length]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter">Hola, {business.name} 👋</h1>
          <p className="text-gray-500 text-sm font-medium max-w-md">Gestiona tu negocio y analiza el impacto de tu menú digital en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button className="flex-1 md:flex-none bg-white/5 border border-white/10 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
             <Calendar size={14} /> Historial completo
           </button>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
        <StatCard 
          label="Visitas" 
          value={business.stats.visits} 
          icon={<Eye size={22} />} 
          color="bg-blue-500/10 text-blue-500" 
          trend="+12%" 
          data={visitsData}
        />
        <StatCard 
          label="Calificación" 
          value={business.averageRating?.toFixed(1) || '0.0'} 
          icon={<Star size={22} />} 
          color="bg-amber-500/10 text-amber-500" 
          trend={business.ratingsCount ? `${business.ratingsCount} votos` : 'Sin votos'} 
        />
        <StatCard 
          label="Clientes (Leads)" 
          value={business.leads.length} 
          icon={<Users size={22} />} 
          color="bg-green-500/10 text-green-500" 
          trend="+5%" 
          data={leadsData}
        />
        <StatCard 
          label="Productos" 
          value={business.products.length} 
          icon={<Package size={22} />} 
          color="bg-purple-500/10 text-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Accesos Rápidos Rediseñados */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Accesos rápidos</h2>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <Zap size={16} className="text-amber-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
               {[
                 { label: 'Productos', icon: <Package size={20} />, to: '/admin/menu', color: 'bg-amber-500/10 text-amber-500' },
                 { label: 'Categorías', icon: <Layers size={20} />, to: '/admin/categories', color: 'bg-blue-500/10 text-blue-500' },
                 { label: 'Banners', icon: <ImageIcon size={20} />, to: '/admin/banners', color: 'bg-purple-500/10 text-purple-500' },
                 { label: 'Eventos', icon: <Calendar size={20} />, to: '/admin/events', color: 'bg-green-500/10 text-green-500' },
                 { label: 'Clientes', icon: <Users size={20} />, to: '/admin/leads', color: 'bg-orange-500/10 text-orange-500' },
                 { label: isAdmin ? 'Súper Admin' : 'Configuración', icon: isAdmin ? <Shield size={20} /> : <Settings size={20} />, to: isAdmin ? '/super-admin' : '/admin/pricing', color: 'bg-gray-500/10 text-gray-400' },
               ].map((item, idx) => (
                 <Link key={idx} to={item.to} className="flex flex-col items-center justify-center p-6 rounded-3xl bg-black border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group relative overflow-hidden">
                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                      {item.icon}
                    </div>
                    <span className="text-white font-black text-[10px] uppercase tracking-[0.2em] text-center">{item.label}</span>
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={12} className="text-amber-500" />
                    </div>
                 </Link>
               ))}
            </div>
          </div>

          {/* Diseñador de QR */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Diseñador de QR</h2>
              <button className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:underline">Personalizar</button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-10">
              <div className="bg-white p-6 rounded-[2rem] shrink-0 shadow-2xl shadow-white/5">
                <img src={qrImageUrl} className="w-32 h-32" alt="QR" />
              </div>
              <div className="flex-1 space-y-6 text-center sm:text-left">
                 <p className="text-gray-500 text-sm leading-relaxed font-medium">Este es tu acceso directo al menú. Puedes descargarlo e imprimirlo para tus mesas o pegarlo en la entrada.</p>
                 <button 
                   onClick={handleDownloadQR}
                   disabled={isDownloading}
                   className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-amber-500 transition-all disabled:opacity-50 shadow-xl"
                 >
                   {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} 
                   Descargar Imagen QR
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Tarjeta de Plan */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Crown size={24} fill="currentColor" />
              </div>
              <span className="bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                {isPro ? 'PRO' : 'Gratis'}
              </span>
            </div>
            <h3 className="text-white font-black text-xl mb-2 tracking-tight">Tu Suscripción</h3>
            <p className="text-gray-500 text-xs font-medium mb-8 leading-relaxed">
              {isPro ? 'Tienes acceso total a todas las funciones premium y soporte prioritario.' : 'Estás usando el plan básico. Actualiza para desbloquear banners y más.'}
            </p>
            <Link to="/admin/pricing" className="block w-full text-center bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-amber-500 transition-all shadow-xl">
              {isPro ? 'Gestionar Plan' : 'Mejorar a PRO'}
            </Link>
          </div>

          {/* Tarjeta de Reputación */}
          <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-white font-black text-lg uppercase tracking-tight">Reputación</h3>
               <Star size={20} className="text-amber-500" />
             </div>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Promedio</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-3xl tracking-tighter">{business.averageRating?.toFixed(1) || '0.0'}</span>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} fill={s <= Math.round(business.averageRating || 0) ? "currentColor" : "none"} />)}
                      </div>
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Puntuación</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">Satisfacción</span>
                    <span className="text-white">{Math.round((business.averageRating || 0) * 20)}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]" 
                      style={{ width: `${(business.averageRating || 0) * 20}%` }} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Total votos</span>
                  <span className="text-white font-black">{business.ratingsCount || 0}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
