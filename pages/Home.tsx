
import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Star, Crown, ChevronRight, Utensils, ChevronDown, Calendar, Clock, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Business, BusinessType, PlanType, Event } from '../types';
import { CUBA_PROVINCES, CUBA_MUNICIPALITIES_BY_PROVINCE } from '../data';
import OptimizedImage from '../components/OptimizedImage';
import { incrementClicks } from '../lib/supabase';

const Home: React.FC<{ businesses: Business[], loading?: boolean }> = ({ businesses, loading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedType, setSelectedType] = useState<BusinessType | 'Todos'>('Todos');

  useEffect(() => {
    setSelectedMunicipality('');
  }, [selectedProvince]);

  const municipalities = selectedProvince ? CUBA_MUNICIPALITIES_BY_PROVINCE[selectedProvince] || [] : [];

  const isProActive = (b: Business) => {
    if (b.plan !== PlanType.PRO) return false;
    if (!b.planExpiresAt) return false;
    return new Date(b.planExpiresAt) > new Date();
  };

  const filteredBusinesses = businesses.filter(b => {
    // Si isVisible es explícitamente false (o su versión snake_case), se oculta.
    // Si es undefined o null, se asume true para evitar errores de carga.
    const isVisible = (b as any).isVisible !== false && (b as any).is_visible !== false;
    if (!isVisible) return false;

    const name = b.name || '';
    const description = b.description || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const province = b.province || '';
    const municipality = b.municipality || '';
    
    const matchesProvince = selectedProvince === '' || province === selectedProvince;
    const matchesMunicipality = selectedMunicipality === '' || municipality === selectedMunicipality;
    const matchesType = selectedType === 'Todos' || b.type === selectedType;
    
    return matchesSearch && matchesProvince && matchesMunicipality && matchesType;
  });

  const sortedBusinesses = [...filteredBusinesses].sort((a, b) => {
    const aPro = isProActive(a);
    const bPro = isProActive(b);
    if (aPro && !bPro) return -1;
    if (!aPro && bPro) return 1;
    return 0;
  });

  // Extraer eventos de negocios filtrados que tengan PRO activo
  const filteredEvents = useMemo(() => {
    const events: (Event & { businessId: string, businessName: string })[] = [];
    filteredBusinesses.forEach(biz => {
      if (isProActive(biz) && biz.events) {
        biz.events.forEach(event => {
          // Solo eventos futuros o de hoy
          const eventDate = new Date(event.dateTime);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (eventDate >= today) {
            events.push({
              ...event,
              businessId: biz.id,
              businessName: biz.name
            });
          }
        });
      }
    });
    // Ordenar por fecha más cercana
    return events.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [filteredBusinesses]);

  const scrollEvents = (direction: 'left' | 'right') => {
    const container = document.getElementById('events-carousel');
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-gray-200">
      <header className="relative min-h-[75vh] flex flex-col items-center justify-center pt-10 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black" />
        
        <div className="relative z-10 max-w-4xl w-full text-center px-4 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-4 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <div className="h-[1px] w-12 bg-amber-500/50" />
            <span className="text-amber-500 text-xs font-medium tracking-[0.3em] uppercase">Explora Cuba</span>
            <div className="h-[1px] w-12 bg-amber-500/50" />
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 tracking-tight uppercase opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Bravo <span className="text-amber-500">Menú</span>
          </h1>
          
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-light opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            Encuentra los mejores restaurantes, bares y cafeterías. Menús actualizados en tiempo real.
          </p>

          <div className="bg-[#1a1a1c]/70 backdrop-blur-md p-4 md:p-5 rounded-3xl border border-white/5 shadow-2xl max-w-2xl mx-auto space-y-3 opacity-0 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-amber-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Busca por nombre o comida..." 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-gray-500 focus:ring-1 focus:ring-amber-500/50 outline-none text-base font-medium shadow-inner transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white appearance-none focus:ring-1 focus:ring-amber-500/50 transition-all text-xs font-medium cursor-pointer outline-none"
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                >
                  <option value="" className="bg-[#1a1a1c]">Toda Cuba</option>
                  {CUBA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>

              <div className="relative">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 opacity-50" size={16} />
                <select 
                  value={selectedMunicipality}
                  onChange={(e) => setSelectedMunicipality(e.target.value)}
                  disabled={!selectedProvince}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-10 text-white appearance-none transition-all text-xs font-medium outline-none disabled:opacity-30"
                >
                  <option value="">Cualquier Municipio</option>
                  {municipalities.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            <div className="pt-2 overflow-x-auto no-scrollbar flex gap-2 pb-0.5">
              {[
                { label: 'Todos', type: 'Todos', icon: '🍽️' },
                { label: 'Restaurantes', type: BusinessType.RESTAURANT, icon: '🍴' },
                { label: 'Bares', type: BusinessType.BAR, icon: '🍸' },
                { label: 'Cafeterías', type: BusinessType.CAFETERIA, icon: '☕' },
                { label: 'Heladerías', type: BusinessType.ICE_CREAM, icon: '🍦' }
              ].map((filter) => (
                <button
                  key={filter.label}
                  onClick={() => setSelectedType(filter.type as any)}
                  className={`px-5 py-3 rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    selectedType === filter.type 
                    ? 'bg-amber-500 text-black border-amber-500 shadow-lg' 
                    : 'bg-white/5 text-gray-500 border-white/10 hover:border-gray-500'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      {/* Carrusel de Eventos */}
      {filteredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-amber-500 font-extrabold text-[10px] uppercase tracking-[0.4em]">
              <Calendar size={14} /> 
              <span>Próximos Eventos ({filteredEvents.length})</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => scrollEvents('left')}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => scrollEvents('right')}
                className="p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div 
            id="events-carousel"
            className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory"
          >
            {filteredEvents.map((event, index) => (
              <Link 
                to={`/negocio/${event.businessId}?tab=eventos`}
                key={event.id}
                onClick={() => incrementClicks('events', event.id)}
                className="min-w-[280px] md:min-w-[350px] bg-[#1a1a1c] rounded-3xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all group snap-start"
              >
                <div className="relative h-32 overflow-hidden">
                  <OptimizedImage 
                    src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'} 
                    alt={event.title}
                    containerClassName="w-full h-full"
                    className="group-hover:scale-110 transition-transform duration-700"
                    loading={index < 2 ? "eager" : "lazy"}
                    fetchPriority={index < 2 ? "high" : "auto"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] to-transparent" />
                  <div className="absolute top-3 right-3 bg-amber-500 text-black px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-lg">
                    {event.price && event.price > 0 ? `$${event.price}` : 'Gratis'}
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-amber-500 text-[9px] font-extrabold uppercase tracking-widest mb-1 block opacity-70">
                    {event.businessName}
                  </span>
                  <h4 className="text-white font-extrabold text-base mb-3 line-clamp-1 uppercase tracking-tight group-hover:text-amber-500 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex flex-wrap gap-4 text-gray-500 text-[10px] font-extrabold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-amber-500" />
                      {new Date(event.dateTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className="text-amber-500" />
                      {new Date(event.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-10 text-amber-500 font-extrabold text-[10px] uppercase tracking-[0.4em]">
          <Utensils size={14} /> 
          <span>Lugares Disponibles ({sortedBusinesses.length})</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#1a1a1c] rounded-3xl overflow-hidden border border-gray-800/50 animate-pulse">
                <div className="h-36 md:h-64 bg-white/5" />
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-white/5 rounded-lg w-3/4" />
                  <div className="h-4 bg-white/5 rounded-lg w-full" />
                  <div className="pt-5 border-t border-white/5 flex justify-between">
                    <div className="h-4 bg-white/5 rounded-lg w-24" />
                    <div className="h-4 bg-white/5 rounded-lg w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedBusinesses.map((business, index) => (
              <Link 
                to={`/negocio/${business.id}`} 
                key={business.id}
                className="group bg-[#1a1a1c] rounded-3xl overflow-hidden border border-gray-800/50 hover:border-amber-500/30 transition-all duration-500 shadow-xl flex flex-col hover:shadow-amber-500/10 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative h-36 md:h-64 overflow-hidden">
                  <OptimizedImage 
                    src={business.coverPhotos?.[0] || (business as any).cover_photos?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200'} 
                    alt={business.name} 
                    containerClassName="w-full h-full"
                    className="group-hover:scale-110 transition-transform duration-1000"
                    loading={index < 3 ? "eager" : "lazy"}
                    fetchPriority={index < 3 ? "high" : "auto"}
                  />
                  <div className="absolute top-5 left-5 flex flex-col gap-2">
                    {isProActive(business) && (
                      <span className="bg-amber-500 text-black font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xl uppercase tracking-wider">
                        <Crown size={12} fill="currentColor" /> Recomendado
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1c] via-transparent to-transparent" />
                  <div className="absolute bottom-5 left-6 right-6">
                    <h3 className="text-lg md:text-xl font-extrabold text-white mb-0 leading-tight uppercase tracking-tight">{business.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="text-amber-500 fill-amber-500" />
                      <span className="text-white text-[10px] font-semibold">
                        {(business.averageRating ?? (business as any).average_rating ?? 0).toFixed(1)} ({(business.ratingsCount ?? (business as any).ratings_count ?? 0)})
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-5 pt-2 flex-1 flex flex-col">
                  <p className="text-gray-400 text-sm line-clamp-2 mb-6 font-light leading-relaxed">
                    {business.description || 'Explora nuestro menú digital.'}
                  </p>
                  <div className="flex items-center justify-between mt-auto border-t border-white/5 pt-5">
                    <div className="flex items-center gap-2 text-gray-500 text-[10px] font-extrabold uppercase tracking-widest">
                      <MapPin size={14} className="text-amber-500" />
                      {business.municipality || (business as any).municipality}
                    </div>
                    <button className="text-amber-500 text-[10px] font-extrabold flex items-center gap-2 hover:translate-x-1 transition-all uppercase tracking-[0.2em]">
                      Ver Menú <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 text-gray-500">
              <Search size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 uppercase tracking-widest">Sin establecimientos</h3>
            <p className="text-gray-500 text-sm font-light">Parece que no hay negocios registrados que coincidan con estos filtros.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
