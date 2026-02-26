
import React from 'react';
import { Eye, Users, Package, Download, Crown, Info, ChevronRight, TrendingUp, Calendar, Zap, Layers, Image as ImageIcon, Settings, Shield, Star, Loader2 } from 'lucide-react';
import { Business, PlanType } from '../types';
import { Link } from 'react-router-dom';

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string, trend?: string }> = ({ label, value, icon, color, trend }) => (
  <div className="bg-[#1a1a1c] border border-gray-800 p-6 rounded-[2rem] flex items-center gap-6 shadow-xl hover:border-white/10 transition-colors">
    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 overflow-hidden">
      <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <h3 className="text-3xl font-bold text-white leading-none">{value}</h3>
        {trend && (
          <span className="text-green-500 text-xs font-bold flex items-center gap-0.5 mb-1">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC<{ business: Business }> = ({ business }) => {
  const isPro = business.plan === PlanType.PRO;
  const isAdmin = business.role === 'admin';
  const [isDownloading, setIsDownloading] = React.useState(false);

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
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Hola, {business.name} 👋</h1>
          <p className="text-gray-500 text-sm font-medium">Gestiona tu negocio y analiza el impacto de tu menú digital.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-white/10 transition-all">
             <Calendar size={14} /> Historial
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Visitas" value={business.stats.visits} icon={<Eye size={24} />} color="bg-blue-500/10 text-blue-500" trend="+12%" />
        <StatCard label="Calificación" value={business.averageRating?.toFixed(1) || '0.0'} icon={<Star size={24} />} color="bg-amber-500/10 text-amber-500" trend={business.ratingsCount ? `${business.ratingsCount} votos` : 'Sin votos'} />
        <StatCard label="Leads" value={business.leads.length} icon={<Users size={24} />} color="bg-green-500/10 text-green-500" trend="+5%" />
        <StatCard label="Productos" value={business.products.length} icon={<Package size={24} />} color="bg-purple-500/10 text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-white mb-6">Accesos rápidos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               {[
                 { label: 'Productos', icon: <Package size={20} />, to: '/admin/menu', color: 'bg-amber-500/10 text-amber-500' },
                 { label: 'Categorías', icon: <Layers size={20} />, to: '/admin/categories', color: 'bg-blue-500/10 text-blue-500' },
                 { label: 'Banners', icon: <ImageIcon size={20} />, to: '/admin/banners', color: 'bg-purple-500/10 text-purple-500' },
                 { label: 'Eventos', icon: <Calendar size={20} />, to: '/admin/events', color: 'bg-green-500/10 text-green-500' },
                 { label: 'Clientes', icon: <Users size={20} />, to: '/admin/leads', color: 'bg-orange-500/10 text-orange-500' },
                 { label: isAdmin ? 'Súper Admin' : 'Plan', icon: isAdmin ? <Shield size={20} /> : <Settings size={20} />, to: isAdmin ? '/super-admin' : '/admin/pricing', color: 'bg-gray-500/10 text-gray-400' },
               ].map((item, idx) => (
                 <Link key={idx} to={item.to} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#242426] border border-transparent hover:border-white/10 hover:bg-[#2a2a2c] transition-all group">
                    <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      {item.icon}
                    </div>
                    <span className="text-white font-medium text-xs uppercase tracking-widest">{item.label}</span>
                 </Link>
               ))}
            </div>
          </div>

          <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Diseñador de QR</h2>
              <button className="text-amber-500 text-xs font-bold hover:underline">Personalizar</button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="bg-white p-4 rounded-3xl shrink-0">
                <img src={qrImageUrl} className="w-32 h-32" alt="QR" />
              </div>
              <div className="flex-1 space-y-4">
                 <p className="text-gray-400 text-sm leading-relaxed font-light">Este es tu acceso directo al menú. Puedes descargarlo e imprimirlo para tus mesas.</p>
                 <button 
                   onClick={handleDownloadQR}
                   disabled={isDownloading}
                   className="w-full bg-[#242426] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#2a2a2c] transition-all disabled:opacity-50"
                 >
                   {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />} 
                   Descargar Imagen QR
                 </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 text-amber-500">
               <Crown size={24} fill="currentColor" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Tu Plan: {isPro ? 'PRO' : 'Gratis'}</h3>
            <p className="text-gray-500 text-xs font-medium mb-6">
              {isPro ? 'Tienes acceso total a todas las funciones premium.' : 'Estás usando el plan básico con límites.'}
            </p>
            <Link to="/admin/pricing" className="block w-full text-center bg-amber-500/10 text-amber-500 border border-amber-500/20 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all">
              {isPro ? 'Ver Mi Suscripción' : 'Actualizar Ahora'}
            </Link>
          </div>

          <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8">
             <h3 className="text-white font-bold text-lg mb-4">Reputación</h3>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-bold uppercase">Promedio</span>
                  <div className="flex items-center gap-1 text-amber-500">
                    <span className="text-white font-bold text-lg">{business.averageRating?.toFixed(1) || '0.0'}</span>
                    <Star size={16} fill="currentColor" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs font-bold uppercase">Total votos</span>
                  <span className="text-white font-bold">{business.ratingsCount || 0}</span>
                </div>
                <div className="pt-2">
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-1000" 
                      style={{ width: `${(business.averageRating || 0) * 20}%` }} 
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
