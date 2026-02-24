
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Phone, MessageCircle, Clock, ChevronRight, 
  Plus, Star, LayoutGrid, Calendar, Camera, 
  Crown, Loader2, ShoppingBag, X, Minus, Truck, Info, CheckCircle, Send,
  Instagram, Facebook, Mail, Globe, ChevronDown, ChevronUp
} from 'lucide-react';
import { Business, Product, Category, PlanType, Event } from '../types.ts';
import { supabase } from '../lib/supabase.ts';
import OptimizedImage from '../components/OptimizedImage.tsx';

interface CartItem extends Product {
  quantity: number;
}

const BusinessDetail: React.FC<{ businesses: Business[] }> = ({ businesses }) => {
  const { id } = useParams<{ id: string }>();
  
  const [dbBusiness, setDbBusiness] = useState<Business | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'eventos' | 'fotos'>('menu');
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [showFullSchedule, setShowFullSchedule] = useState(false);

  // Estados del Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Estados para Calificación
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Estados para Domicilio
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState<'inside' | 'outside'>('inside');
  const [deliveryData, setDeliveryData] = useState({
    clientPhone: '',
    receiverName: '',
    receiverPhone: '',
    address: '',
    notes: ''
  });

  const businessFromProps = businesses.find(b => b.id === id);
  
  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      
      const needsData = !businessFromProps || !businessFromProps.products || businessFromProps.products.length === 0;
      
      if (needsData) {
        setIsLoadingDetails(true);
        try {
          const { data: bizData, error: bizError } = await supabase
            .from('businesses')
            .select('*, products(*), categories(*), events(*), banners(*)')
            .eq('id', id)
            .single();

          if (bizData) {
            setDbBusiness({
              ...bizData,
              leads: [],
              stats: bizData.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
            });
          }
        } catch (err) {
          console.error("Error fetching detail data:", err);
        } finally {
          setIsLoadingDetails(false);
        }
      }
    };
    fetchFullData();
  }, [id, businessFromProps]);

  const business = useMemo(() => {
    if (dbBusiness) return dbBusiness;
    return businessFromProps || null;
  }, [dbBusiness, businessFromProps]);

  // Lógica de Horarios
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const todayName = useMemo(() => {
    const daysMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return daysMap[new Date().getDay()];
  }, []);

  const isCurrentlyOpen = useMemo(() => {
    if (!business?.schedule) return true;
    const config = (business.schedule as Record<string, any>)[todayName];
    
    if (!config || !config.open) return false;
    
    const now = new Date();
    const [hOpen, mOpen] = config.from.split(':').map(Number);
    const [hClose, mClose] = config.to.split(':').map(Number);
    
    const openTime = hOpen * 60 + mOpen;
    const closeTime = hClose * 60 + mClose;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return currentTime >= openTime && currentTime < closeTime;
  }, [business, todayName]);

  const sortedSchedule = useMemo(() => {
    if (!business?.schedule) return [];
    const schedule = business.schedule as Record<string, any>;
    return daysOfWeek.map(day => ({
      day,
      ...schedule[day]
    })).filter(item => item.from !== undefined);
  }, [business]);

  const handleRatingSubmit = async () => {
    if (!business || hasRated || isRatingSubmitting || selectedRating === 0) return;
    
    setIsRatingSubmitting(true);
    try {
      const currentRating = business.averageRating || 0;
      const currentCount = business.ratingsCount || 0;
      const newCount = currentCount + 1;
      const newAvg = ((currentRating * currentCount) + selectedRating) / newCount;

      const { error } = await supabase
        .from('businesses')
        .update({ averageRating: newAvg, ratingsCount: newCount })
        .eq('id', business.id);

      if (!error) {
        setHasRated(true);
        if (dbBusiness) {
          setDbBusiness({ ...dbBusiness, averageRating: newAvg, ratingsCount: newCount });
        }
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert("Error al enviar calificación. Inténtelo más tarde.");
    } finally {
      setIsRatingSubmitting(false);
    }
  };

  const banners = useMemo(() => {
    if (business?.plan !== PlanType.PRO) return [];
    return business?.banners || [];
  }, [business]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const categories = useMemo(() => business?.categories || [], [business]);
  const products = useMemo(() => (business?.products || []).filter(p => p.isVisible !== false), [business]);
  const events = useMemo(() => (business?.events || []), [business]);

  const filteredProducts = useMemo(() => {
    if (!business) return [];
    if (selectedCategory === 'Todo') return products;
    return products.filter(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      return cat?.name === selectedCategory;
    });
  }, [business, products, categories, selectedCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);
  const cartItemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const deliveryPrice = useMemo(() => {
    if (!business?.deliveryEnabled) return 0;
    return deliveryZone === 'inside' 
      ? (business?.deliveryPriceInside || 0) 
      : (business?.deliveryPriceOutside || 0);
  }, [business, deliveryZone]);

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    const canOrder = business?.plan === PlanType.PRO && business?.deliveryEnabled;
    if (!canOrder) return;

    if (!showDeliveryForm) {
      setIsCartOpen(false);
      setShowDeliveryForm(true);
      return;
    }
    
    if (!deliveryData.clientPhone || !deliveryData.receiverName || !deliveryData.address) {
      alert("Por favor completa los campos obligatorios (*)");
      return;
    }
    
    let message = `*NUEVO PEDIDO*\n------------------------\n`;
    cart.forEach(item => { message += `• ${item.quantity}x ${item.name} ($${item.price.toLocaleString()})\n`; });
    message += `\n*Subtotal:* $${cartTotal.toLocaleString()}\n`;
    message += `*Costo envío:* $${deliveryPrice.toLocaleString()}\n*Total:* $${(cartTotal + deliveryPrice).toLocaleString()}\n\n*ENTREGA:*\n• *Zona:* ${deliveryZone === 'inside' ? 'Dentro de ' + business.municipality : 'Fuera de ' + business.municipality}\n• *Nombre:* ${deliveryData.receiverName}\n• *Tel. Cliente:* ${deliveryData.clientPhone}\n• *Dirección:* ${deliveryData.address}\n`;
    
    if (deliveryData.notes.trim()) {
      message += `• *Notas:* ${deliveryData.notes}\n`;
    }
    
    const phone = (business?.whatsapp || business?.phone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoadingDetails) return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-amber-500" size={48} />
    </div>
  );

  if (!business && !isLoadingDetails) return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center text-white p-6">
       <h1 className="text-2xl font-bold mb-4">Negocio no encontrado</h1>
       <Link to="/" className="text-amber-500 hover:underline">Volver al inicio</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] pb-20 font-sans relative">
      {cartItemsCount > 0 && !isCartOpen && !showDeliveryForm && (
        <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 z-[80] bg-amber-500 text-black px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
          <ShoppingBag size={24} strokeWidth={2.5} />
          <span className="text-lg font-black">{cartItemsCount}</span>
        </button>
      )}

      {/* Hero Header */}
      <div className="relative h-[20vh] md:h-[45vh] w-full overflow-hidden">
        <OptimizedImage 
          src={business?.coverPhotos?.[0] || 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?auto=format&fit=crop&q=80&w=1200'} 
          containerClassName="w-full h-full"
          className="scale-105 grayscale-[10%]"
          alt="Hero" 
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-black/40 to-black/10" />
        <div className="absolute bottom-8 left-0 right-0 px-6 max-w-5xl mx-auto flex items-end gap-6">
          <OptimizedImage 
            src={business?.logoUrl || 'https://via.placeholder.com/150'} 
            containerClassName="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-[#141416] p-1 border-2 border-white/10 shadow-2xl" 
            className="rounded-2xl" 
            alt="Logo" 
            loading="eager"
          />
          <div className="flex-1 mb-2">
            <div className="flex items-center gap-2 mb-2">
               <span className="bg-amber-500 text-black text-[12px] font-bold px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tighter">
                 <Crown size={12} fill="currentColor" /> {business?.plan}
               </span>
               <span className="text-amber-500 text-[12px] font-medium uppercase tracking-wider bg-black/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">{business?.type}</span>
            </div>
            <h1 className="text-xl md:text-4xl font-bold text-white tracking-tight mb-1">{business?.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= Math.round(business?.averageRating || 0) ? "currentColor" : "none"} />)}
              </div>
              <span className="text-white/50 text-xs font-bold">({business?.ratingsCount || 0})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-8 mt-8">
        {banners.length > 0 && (
          <div className="relative h-40 md:h-52 rounded-3xl overflow-hidden group shadow-2xl border border-white/5 animate-fade-in">
            {banners.map((banner, index) => (
              <div key={banner.id} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                <OptimizedImage 
                  src={banner.imageUrl} 
                  containerClassName="w-full h-full" 
                  className="transition-transform duration-[5s] group-hover:scale-110" 
                  alt={banner.title || 'Promo'} 
                  loading={index === 0 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/30 to-transparent flex flex-col justify-center p-6 md:p-8">
                   <div className="bg-amber-500 text-black w-fit px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Destacado</div>
                   <h3 className="text-white text-base md:text-xl font-bold mb-2 uppercase tracking-tight leading-snug max-w-sm drop-shadow-lg">{banner.title || "Oferta Especial"}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card con Redes Sociales y Horarios */}
        <div className="bg-[#141416] rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="text-amber-500 shrink-0 mt-1" size={20} />
                <div>
                  <p className="text-white text-base font-bold">{business?.address}</p>
                  <p className="text-gray-500 text-[12px] font-medium uppercase tracking-widest">{business?.municipality}, {business?.province}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button onClick={() => window.open(`tel:${business?.phone}`, '_self')} className="shrink-0 bg-[#242426] text-amber-500 h-10 px-5 rounded-2xl text-[12px] font-black uppercase flex items-center gap-2 border border-white/5 hover:bg-white hover:text-black transition-all">
                  <Phone size={16} /> Llamar
                </button>
                <button onClick={() => window.open(`https://wa.me/${(business?.whatsapp || business?.phone || '').replace(/[^0-9]/g, '')}`, '_blank')} className="shrink-0 bg-[#25d366]/10 text-[#25d366] h-10 px-5 rounded-2xl text-[12px] font-black uppercase flex items-center gap-2 border border-[#25d366]/20 hover:bg-[#25d366] hover:text-white transition-all">
                  <MessageCircle size={16} /> WhatsApp
                </button>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                {business?.instagram && (
                  <button onClick={() => window.open(business.instagram?.includes('http') ? business.instagram : `https://instagram.com/${business.instagram}`, '_blank')} className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#e4405f] transition-all">
                    <Instagram size={18} />
                  </button>
                )}
                {business?.facebook && (
                  <button onClick={() => window.open(business.facebook?.includes('http') ? business.facebook : `https://facebook.com/${business.facebook}`, '_blank')} className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1877f2] transition-all">
                    <Facebook size={18} />
                  </button>
                )}
                {business?.email && (
                  <button onClick={() => window.open(`mailto:${business.email}`, '_blank')} className="w-10 h-10 rounded-full bg-[#1a1a1c] border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-amber-500 hover:text-black transition-all">
                    <Mail size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Horarios de Atención - MEJORADO */}
            <div className="bg-black/20 rounded-3xl p-4 border border-white/5 overflow-hidden transition-all duration-300">
              <button 
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                className="w-full flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isCurrentlyOpen ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    <Clock size={20} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">Horario Comercial</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isCurrentlyOpen ? 'text-green-500' : 'text-red-500'}`}>
                      {isCurrentlyOpen ? 'Abierto ahora' : 'Cerrado temporalmente'}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 group-hover:bg-amber-500 group-hover:text-black transition-all">
                   {showFullSchedule ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${showFullSchedule ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 border-t border-white/5 space-y-1">
                  {sortedSchedule.map((item) => {
                    const isToday = item.day === todayName;
                    return (
                      <div 
                        key={item.day} 
                        className={`flex justify-between items-center px-4 py-2.5 rounded-xl transition-colors ${isToday ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-transparent'}`}
                      >
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${isToday ? 'text-amber-500' : 'text-gray-500'}`}>
                          {item.day}
                        </span>
                        <div className="flex items-center gap-2">
                          {!item.open && <span className="w-1.5 h-1.5 rounded-full bg-red-500/50" />}
                          <span className={`text-[11px] font-bold uppercase tracking-widest ${item.open ? 'text-white' : 'text-red-500/50'}`}>
                            {item.open ? `${item.from} - ${item.to}` : 'Cerrado'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {sortedSchedule.length === 0 && (
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest italic py-2 text-center">Horarios no especificados</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Principales */}
        <div className="bg-[#141416] p-1.5 rounded-2xl border border-white/5 flex gap-1.5 shadow-xl sticky top-20 z-50">
          {['menu', 'eventos', 'fotos'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 py-3.5 rounded-xl text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all ${activeTab === t ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-gray-500 hover:text-white'}`}>
              {t === 'menu' ? <LayoutGrid size={16} /> : t === 'eventos' ? <Calendar size={16} /> : <Camera size={16} />} {t}
            </button>
          ))}
        </div>

        {/* Contenido Dinámico */}
        {activeTab === 'menu' && (
          <div className="animate-fade-in space-y-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              <button 
                onClick={() => setSelectedCategory('Todo')} 
                className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${selectedCategory === 'Todo' ? 'bg-amber-500 text-black border-amber-500 shadow-lg' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'}`}
              >
                Todo
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setSelectedCategory(cat.name)} 
                  className={`shrink-0 px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all border ${selectedCategory === cat.name ? 'bg-amber-500 text-black border-amber-500 shadow-lg' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(prod => (
                <div key={prod.id} className="bg-[#141416] rounded-3xl overflow-hidden border border-white/5 flex flex-col group shadow-2xl hover:translate-y-[-4px] transition-all duration-300">
                  <div className="relative aspect-square overflow-hidden">
                    <OptimizedImage src={prod.imageUrl} containerClassName="w-full h-full" className="transition-transform duration-700 group-hover:scale-110" alt={prod.name} />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-tight truncate">{prod.name}</h3>
                    <p className="text-gray-500 text-[10px] leading-relaxed mb-4 line-clamp-2">{prod.description || 'Sin descripción.'}</p>
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                      <span className="text-amber-500 font-bold text-lg">${prod.price}</span>
                      <button onClick={() => addToCart(prod)} className="w-10 h-10 bg-amber-500 text-black rounded-full flex items-center justify-center hover:bg-white transition-all shadow-xl active:scale-90"><Plus size={20} strokeWidth={3} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sistema de Calificación */}
            <div className="bg-[#141416] rounded-3xl p-6 border border-white/5 shadow-2xl text-center mt-12 mb-12">
              {hasRated ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-white font-bold text-xl uppercase tracking-tight">¡Gracias por calificar!</h3>
                  <p className="text-gray-500 text-sm">Tu opinión ayuda a que este lugar siga mejorando.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-white font-bold text-xl uppercase tracking-tight">¿Qué te pareció el lugar?</h3>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setSelectedRating(star)}
                        className="group relative transition-transform hover:scale-125 active:scale-95"
                      >
                        <Star 
                          size={40} 
                          className={`transition-colors duration-300 ${
                            (hoverRating || selectedRating) >= star ? 'text-amber-500 fill-amber-500' : 'text-white/10'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  {selectedRating > 0 && (
                    <button 
                      onClick={handleRatingSubmit}
                      disabled={isRatingSubmitting}
                      className="inline-flex items-center gap-2 bg-amber-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 animate-fade-in"
                    >
                      {isRatingSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      Enviar Calificación
                    </button>
                  )}
                  {selectedRating === 0 && (
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Toca una estrella para calificar</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sección de Eventos */}
        {activeTab === 'eventos' && (
          <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            {events.length > 0 ? (
              events.map(event => (
                <div key={event.id} className="bg-[#141416] border border-white/5 rounded-3xl overflow-hidden group shadow-2xl flex flex-col">
                  <div className="relative h-56 overflow-hidden">
                    <OptimizedImage src={event.imageUrl} containerClassName="w-full h-full" className="group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute top-4 right-4 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-xl tracking-widest">
                      {new Date(event.dateTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <h3 className="text-white text-xl font-bold uppercase tracking-tight">{event.title}</h3>
                    <div className="flex flex-wrap gap-4 text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                       <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-500" /> {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                       <span className="flex items-center gap-1.5"><Calendar size={14} className="text-amber-500" /> {new Date(event.dateTime).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{event.description}</p>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                       <span className="text-amber-500 font-bold text-lg">{event.price ? `$${event.price}` : 'Entrada Libre'}</span>
                       <button className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:text-amber-500 transition-colors">Interesado <ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-24 text-center text-gray-500 space-y-4 bg-[#141416] rounded-3xl border border-dashed border-white/10">
                 <Calendar className="mx-auto opacity-20" size={48} />
                 <p className="uppercase tracking-widest font-black text-xs">No hay eventos programados</p>
              </div>
            )}
          </div>
        )}

        {/* Galería */}
        {activeTab === 'fotos' && (
          <div className="animate-fade-in grid grid-cols-2 md:grid-cols-3 gap-4 pb-12">
            {business?.coverPhotos?.map((photo, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-white/5 bg-gray-900 group">
                <OptimizedImage src={photo} containerClassName="w-full h-full" className="group-hover:scale-110 transition-transform duration-700" />
              </div>
            ))}
            {(!business?.coverPhotos || business.coverPhotos.length === 0) && (
              <div className="col-span-full py-24 text-center text-gray-500 space-y-4 bg-[#141416] rounded-3xl border border-dashed border-white/10">
                 <Camera className="mx-auto opacity-20" size={48} />
                 <p className="uppercase tracking-widest font-black text-xs">No hay fotos disponibles</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAWER DEL CARRITO */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]" onClick={() => setIsCartOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#141416] rounded-t-3xl border-t border-white/10 shadow-2xl animate-slide-up max-h-[85vh] flex flex-col">
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <h2 className="text-xl font-bold text-white tracking-tight">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-gray-500"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-[#1a1a1c] p-3 rounded-2xl border border-white/5">
                  <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm uppercase truncate">{item.name}</h4>
                    <p className="text-amber-500 font-black text-xs">${item.price}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 px-2 py-1 rounded-xl">
                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                    <span className="text-white font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-white/5 bg-[#0a0a0b]/50 space-y-6">
              <div className="flex justify-between font-bold">
                <span className="text-gray-500 uppercase tracking-widest text-xs">Total</span>
                <span className="text-amber-500 text-2xl">${cartTotal}</span>
              </div>
              
              {business?.plan === PlanType.PRO && business?.deliveryEnabled ? (
                <button 
                  onClick={handleWhatsAppOrder} 
                  className="w-full bg-[#25d366] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-2xl transition-all hover:bg-[#20bd5a]"
                >
                  <MessageCircle size={22} fill="currentColor" /> Realizar pedido por WhatsApp
                </button>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex items-start gap-4 animate-fade-in">
                  <div className="bg-amber-500 p-2 rounded-xl text-black">
                    <Info size={20} />
                  </div>
                  <p className="text-amber-500/90 text-sm font-medium leading-relaxed">
                    Esta lista es <span className="font-bold underline">solo de referencia</span> para mostrar al camarero y agilizar tu pedido en mesa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showDeliveryForm && (
        <div className="fixed inset-0 z-[110] bg-[#0a0a0b] flex flex-col animate-fade-in overflow-y-auto">
          <header className="sticky top-0 p-6 flex items-center justify-between bg-[#0a0a0b] border-b border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2"><Truck className="text-[#25d366]" /> Entrega</h2>
            <button onClick={() => setShowDeliveryForm(false)} className="text-gray-500"><X size={28} /></button>
          </header>
          <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
            <div className="bg-[#12241b] rounded-2xl p-6 text-center border border-[#25d366]/20">
               <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Costo de envío</p>
               <h3 className="text-[#25d366] text-4xl font-black uppercase">CUP {deliveryPrice}</h3>
               <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em]">{deliveryZone === 'inside' ? 'Local' : 'Fuera de zona'}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
               <button onClick={() => setDeliveryZone('inside')} className={`p-5 rounded-2xl border text-left flex justify-between ${deliveryZone === 'inside' ? 'bg-[#1a1a1c] border-amber-500/50 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}><span>Local</span><span className="font-bold">CUP {business?.deliveryPriceInside}</span></button>
               <button onClick={() => setDeliveryZone('outside')} className={`p-5 rounded-2xl border text-left flex justify-between ${deliveryZone === 'outside' ? 'bg-[#1a1a1c] border-amber-500/50 text-white' : 'bg-transparent border-white/5 text-gray-500'}`}><span>Otro</span><span className="font-bold">CUP {business?.deliveryPriceOutside}</span></button>
            </div>
            <div className="space-y-4">
              <input placeholder="Nombre" className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 px-5 text-white" value={deliveryData.receiverName} onChange={e => setDeliveryData({...deliveryData, receiverName: e.target.value})} />
              <input placeholder="Teléfono" className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 px-5 text-white" value={deliveryData.clientPhone} onChange={e => setDeliveryData({...deliveryData, clientPhone: e.target.value})} />
              <textarea placeholder="Dirección completa" className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 px-5 text-white resize-none" rows={3} value={deliveryData.address} onChange={e => setDeliveryData({...deliveryData, address: e.target.value})} />
              <textarea placeholder="Notas adicionales (Ej: Cerca de la bodega, traer cambio de 1000...)" className="w-full bg-[#1a1a1c] border border-white/10 rounded-xl py-4 px-5 text-white resize-none" rows={2} value={deliveryData.notes} onChange={e => setDeliveryData({...deliveryData, notes: e.target.value})} />
            </div>
            <div className="pt-6 flex items-center justify-between"><span className="text-gray-500 uppercase text-xs font-bold">Total Final</span><span className="text-amber-500 text-3xl font-black">${cartTotal + deliveryPrice}</span></div>
            <button onClick={handleWhatsAppOrder} className="w-full bg-[#25d366] text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl">Confirmar por WhatsApp</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessDetail;
