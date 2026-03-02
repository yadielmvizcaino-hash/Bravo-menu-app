
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MapPin, Phone, MessageCircle, Clock, ChevronRight, 
  Plus, Star, LayoutGrid, Calendar, Camera, 
  Crown, Loader2, ShoppingBag, X, Minus, Truck, Info, CheckCircle, Send,
  Instagram, Facebook, Mail, Globe, ChevronDown, ChevronUp, Trash2, Navigation
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
  const [fetchError, setFetchError] = useState<string | null>(null);
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
      
      // Incrementar visita de forma asíncrona
      supabase.rpc('increment_business_visit', { target_business_id: id })
        .then(({ error }) => {
          if (error) console.warn("Error incrementando visita:", error);
        });

      const needsData = !businessFromProps || !businessFromProps.products || businessFromProps.products.length === 0;
      
      if (needsData) {
        setIsLoadingDetails(true);
        try {
          const { data: bizData, error: bizError } = await supabase
            .from('businesses')
            .select('*, products(*), categories(*), events(*), banners(*)')
            .eq('id', id)
            .single();

          if (bizError) {
            console.error("Supabase Error:", bizError);
            setFetchError(bizError.message);
            throw bizError;
          }

          if (bizData) {
            setDbBusiness({
              ...bizData,
              isVisible: bizData.isVisible ?? bizData.is_visible ?? true,
              logoUrl: bizData.logoUrl ?? bizData.logo_url,
              coverPhotos: bizData.coverPhotos ?? bizData.cover_photos ?? [],
              averageRating: bizData.averageRating ?? bizData.average_rating ?? 0,
              ratingsCount: bizData.ratingsCount ?? bizData.ratings_count ?? 0,
              planExpiresAt: bizData.planExpiresAt ?? bizData.plan_expires_at,
              cuisineTypes: bizData.cuisineTypes ?? bizData.cuisine_types ?? [],
              deliveryEnabled: bizData.deliveryEnabled ?? bizData.delivery_enabled ?? false,
              deliveryPriceInside: bizData.deliveryPriceInside ?? bizData.delivery_price_inside ?? 0,
              deliveryPriceOutside: bizData.deliveryPriceOutside ?? bizData.delivery_price_outside ?? 0,
              products: (bizData.products || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                categoryId: p.categoryId ?? p.category_id,
                imageUrl: p.imageUrl ?? p.image_url,
                isVisible: p.isVisible ?? p.is_visible ?? true,
                isHighlighted: p.isHighlighted ?? p.is_highlighted ?? false
              })),
              categories: bizData.categories || [],
              events: (bizData.events || []).map((e: any) => ({
                ...e,
                dateTime: e.dateTime ?? e.date_time,
                imageUrl: e.imageUrl ?? e.image_url,
                interestedCount: e.interestedCount ?? e.interested_count ?? 0
              })),
              banners: (bizData.banners || []).map((b: any) => ({
                ...b,
                imageUrl: b.imageUrl ?? b.image_url,
                linkUrl: b.linkUrl ?? b.link_url
              })),
              leads: [],
              stats: bizData.stats || { visits: 0, qrScans: 0, uniqueVisitors: 0 }
            } as Business);
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

  const todaySchedule = useMemo(() => {
    if (!business?.schedule) return null;
    return (business.schedule as Record<string, any>)[todayName];
  }, [business, todayName]);

  const isCurrentlyOpen = useMemo(() => {
    if (!todaySchedule || !todaySchedule.open) return false;
    
    const now = new Date();
    const [hOpen, mOpen] = todaySchedule.from.split(':').map(Number);
    const [hClose, mClose] = todaySchedule.to.split(':').map(Number);
    
    const openTime = hOpen * 60 + mOpen;
    const closeTime = hClose * 60 + mClose;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return currentTime >= openTime && currentTime < closeTime;
  }, [todaySchedule]);

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
        .update({ average_rating: newAvg, ratings_count: newCount })
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
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-amber-500" size={48} />
    </div>
  );

  if (fetchError) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
       <h1 className="text-2xl font-bold text-red-500 mb-4">Error de Base de Datos</h1>
       <p className="text-gray-400 mb-6 text-center max-w-md">{fetchError}</p>
       <p className="text-amber-500 text-sm mb-6 text-center max-w-md">
         Asegúrate de haber ejecutado el script SQL en Supabase para crear las relaciones (Foreign Keys) correctamente.
       </p>
       <Link to="/" className="bg-amber-500 text-black px-6 py-3 rounded-xl font-bold">Volver al inicio</Link>
    </div>
  );

  if (!business && !isLoadingDetails) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
       <h1 className="text-2xl font-bold mb-4">Negocio no encontrado</h1>
       <Link to="/" className="text-amber-500 hover:underline">Volver al inicio</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pb-20 font-sans relative">
      {cartItemsCount > 0 && !isCartOpen && !showDeliveryForm && (
        <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 z-[80] bg-amber-500 text-black px-4 py-3 rounded-full shadow-2xl flex items-center gap-3 hover:scale-105 active:scale-95 transition-all">
          <ShoppingBag size={24} strokeWidth={2.5} />
          <span className="text-lg font-black">{cartItemsCount}</span>
        </button>
      )}

      {/* Hero Header */}
      <div className="relative h-[22vh] md:h-[55vh] w-full overflow-hidden">
        <OptimizedImage 
          src={business?.coverPhotos?.[0] || 'https://images.unsplash.com/photo-1551269901-5c5e14c25df7?auto=format&fit=crop&q=80&w=1200'} 
          containerClassName="w-full h-full"
          className="scale-105 grayscale-[10%]"
          alt="Hero" 
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
      </div>

      {/* Business Info Section - Integrated Desktop Layout */}
      <div className="relative z-10 -mt-12 md:-mt-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:gap-12">
          {/* Left Side: Logo & Name */}
          <div className="flex items-end gap-4 md:gap-10 flex-1">
            <OptimizedImage 
              src={business?.logoUrl || 'https://via.placeholder.com/150'} 
              containerClassName="w-24 h-24 md:w-48 md:h-48 rounded-[2.5rem] md:rounded-[3.5rem] bg-[#0a0a0b] p-1.5 border-4 border-[#0a0a0b] shadow-2xl shrink-0" 
              className="rounded-[2rem] md:rounded-[3rem]" 
              alt="Logo" 
              loading="eager"
              fetchPriority="high"
            />
            <div className="flex-1 pb-2 md:pb-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                 <span className="bg-amber-500 text-black text-[10px] md:text-[12px] font-black px-3 py-1 rounded-lg flex items-center gap-1.5 uppercase tracking-wider shadow-lg shadow-amber-500/20">
                   <Crown size={12} fill="currentColor" /> {business?.plan}
                 </span>
                 <span className="text-white/90 text-[10px] md:text-[12px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-xl px-3 py-1 rounded-lg border border-white/10">{business?.type}</span>
              </div>
              <h1 className="text-3xl md:text-7xl font-black text-white tracking-tighter mb-3 leading-[0.9] drop-shadow-2xl">{business?.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} fill={s <= Math.round(business?.averageRating || 0) ? "currentColor" : "none"} />)}
                </div>
                <span className="text-white/50 text-xs font-black uppercase tracking-widest bg-black/20 backdrop-blur-sm px-2 py-1 rounded-md">({business?.ratingsCount || 0} reseñas)</span>
              </div>
            </div>
          </div>

          {/* Right Side: Info (Desktop - Integrated into Hero) */}
          <div className="hidden md:flex flex-col items-end gap-6 pb-8 shrink-0">
            {/* Address & Socials */}
            <div className="text-right space-y-2">
              <h3 className="text-white text-lg font-black uppercase tracking-tight leading-tight drop-shadow-lg">{business?.address}</h3>
              <div className="flex items-center justify-end gap-4">
                <p className="text-white/60 text-xs font-black uppercase tracking-widest">{business?.municipality}, {business?.province}</p>
                <div className="h-4 w-[1px] bg-white/20" />
                <div className="flex items-center gap-4">
                  {business?.instagram && (
                    <button onClick={() => window.open(business.instagram?.includes('http') ? business.instagram : `https://instagram.com/${business.instagram}`, '_blank')} className="text-white/60 hover:text-white transition-all hover:scale-110">
                      <Instagram size={18} />
                    </button>
                  )}
                  {business?.facebook && (
                    <button onClick={() => window.open(business.facebook?.includes('http') ? business.facebook : `https://facebook.com/${business.facebook}`, '_blank')} className="text-white/60 hover:text-white transition-all hover:scale-110">
                      <Facebook size={18} />
                    </button>
                  )}
                  {business?.email && (
                    <button onClick={() => window.open(`mailto:${business.email}`, '_blank')} className="text-white/60 hover:text-white transition-all hover:scale-110">
                      <Mail size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business?.address + ', ' + business?.municipality + ', ' + business?.province)}`, '_blank')}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl border border-white/10 hover:bg-white hover:text-black transition-all text-[11px] font-black uppercase tracking-widest shadow-xl"
              >
                <MapPin size={14} /> Llegar
              </button>
              <button 
                onClick={() => window.open(`tel:${business?.phone}`, '_self')}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl border border-white/10 hover:bg-white hover:text-black transition-all text-[11px] font-black uppercase tracking-widest shadow-xl"
              >
                <Phone size={14} /> Llamar
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/${(business?.whatsapp || business?.phone || '').replace(/[^0-9]/g, '')}`, '_blank')}
                className="flex items-center gap-2 bg-[#25d366] text-white px-6 py-3.5 rounded-2xl hover:bg-[#22c35e] transition-all text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-[#25d366]/20"
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>

            {/* Schedule - Minimalist for Hero */}
            <div className="relative group">
              <button 
                onClick={() => setShowFullSchedule(!showFullSchedule)}
                className="flex items-center gap-4 bg-black/40 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/5 hover:border-white/20 transition-all"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isCurrentlyOpen ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'}`} />
                <div className="flex flex-col items-start">
                  <span className="text-white font-black text-[10px] uppercase tracking-widest">{isCurrentlyOpen ? 'Abierto' : 'Cerrado'}</span>
                  <span className="text-white/50 font-bold text-[9px] uppercase tracking-tighter">
                    {todaySchedule?.open ? `${todaySchedule.from} - ${todaySchedule.to}` : 'Hoy cerrado'}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-white/30 transition-transform duration-300 ${showFullSchedule ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Schedule */}
              <div className={`absolute bottom-full right-0 mb-4 w-64 bg-[#141416]/95 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${showFullSchedule ? 'max-h-[500px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-4'}`}>
                <div className="p-5 space-y-1.5">
                  <h4 className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-3 px-2">Horarios Semanales</h4>
                  {sortedSchedule.map((item) => {
                    const isToday = item.day === todayName;
                    return (
                      <div key={item.day} className={`flex justify-between items-center px-4 py-2.5 rounded-xl transition-all ${isToday ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'hover:bg-white/5'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-black' : 'text-white/60'}`}>{item.day}</span>
                        <span className={`text-[10px] font-bold ${isToday ? 'text-black' : item.open ? 'text-white' : 'text-red-500/40'}`}>
                          {item.open ? `${item.from} - ${item.to}` : 'Cerrado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-12 mt-12">
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

        {/* Info Card Unificada y Compacta (Mobile) */}
        <div className="md:hidden bg-[#141416] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-5 space-y-6">
            {/* Fila 1: Ubicación y Redes */}
            <div className="flex flex-col">
              <h3 className="text-white text-lg font-bold leading-tight mb-1">{business?.address}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-gray-500 text-xs font-medium">{business?.municipality}, {business?.province}</p>
                <div className="flex items-center gap-4">
                  {business?.instagram && (
                    <button onClick={() => window.open(business.instagram?.includes('http') ? business.instagram : `https://instagram.com/${business.instagram}`, '_blank')} className="text-gray-500 hover:text-[#e4405f] transition-colors" title="Instagram">
                      <Instagram size={18} />
                    </button>
                  )}
                  {business?.facebook && (
                    <button onClick={() => window.open(business.facebook?.includes('http') ? business.facebook : `https://facebook.com/${business.facebook}`, '_blank')} className="text-gray-500 hover:text-[#1877f2] transition-colors" title="Facebook">
                      <Facebook size={18} />
                    </button>
                  )}
                  {business?.email && (
                    <button onClick={() => window.open(`mailto:${business.email}`, '_blank')} className="text-gray-500 hover:text-amber-500 transition-colors" title="Email">
                      <Mail size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fila 2: Botones de Acción en una sola fila */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business?.address + ', ' + business?.municipality + ', ' + business?.province)}`, '_blank')}
                className="flex items-center justify-center bg-[#1a1a1c] text-white px-4 py-3 rounded-2xl border border-white/5 hover:bg-white hover:text-black transition-all text-[11px] font-black uppercase tracking-widest"
              >
                Llegar
              </button>
              
              <button 
                onClick={() => window.open(`tel:${business?.phone}`, '_self')}
                className="flex items-center justify-center bg-[#1a1a1c] text-white px-4 py-3 rounded-2xl border border-white/5 hover:bg-white hover:text-black transition-all text-[11px] font-black uppercase tracking-widest"
              >
                Llamar
              </button>
              
              <button 
                onClick={() => window.open(`https://wa.me/${(business?.whatsapp || business?.phone || '').replace(/[^0-9]/g, '')}`, '_blank')}
                className="flex items-center justify-center bg-[#25d366] text-white px-4 py-3 rounded-2xl hover:bg-[#22c35e] transition-all text-[11px] font-black uppercase tracking-widest shadow-lg shadow-[#25d366]/10"
              >
                WhatsApp
              </button>
            </div>
          </div>

          {/* Fila 3: Horario Desplegable */}
          <div className="bg-black/20 border-t border-white/5">
            <button 
              onClick={() => setShowFullSchedule(!showFullSchedule)}
              className="w-full p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm capitalize">{todayName}</span>
                <span className="text-gray-400 font-medium text-sm">
                  {todaySchedule?.open ? `${todaySchedule.from} - ${todaySchedule.to}` : 'Cerrado'}
                </span>
                {isCurrentlyOpen ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] ml-1" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] ml-1" />
                )}
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">
                {showFullSchedule ? 'Ocultar' : 'Horarios'}
              </span>
            </button>

            <div className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${showFullSchedule ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="px-4 pb-4 space-y-0.5">
                {sortedSchedule.map((item) => {
                  const isToday = item.day === todayName;
                  return (
                    <div 
                      key={item.day} 
                      className={`flex justify-between items-center px-3 py-1.5 rounded-xl transition-colors ${isToday ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-transparent'}`}
                    >
                      <span className={`text-xs font-bold capitalize ${isToday ? 'text-amber-500' : 'text-gray-400'}`}>
                        {item.day}
                      </span>
                      <div className="flex items-center gap-2">
                        {!item.open && <span className="w-1 h-1 rounded-full bg-red-500/50" />}
                        <span className={`text-xs font-bold ${item.open ? 'text-white' : 'text-red-500/50'}`}>
                          {item.open ? `${item.from} - ${item.to}` : 'Cerrado'}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-white tracking-tight">Tu Pedido</h2>
                {cart.length > 0 && (
                  <button 
                    onClick={() => {
                      if (window.confirm('¿Limpiar toda la lista de productos?')) {
                        setCart([]);
                      }
                    }}
                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    title="Limpiar lista"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
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
            <div className="p-8 border-t border-white/5 bg-black/50 space-y-6">
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
        <div className="fixed inset-0 z-[110] bg-black flex flex-col animate-fade-in overflow-y-auto">
          <header className="sticky top-0 p-6 flex items-center justify-between bg-black border-b border-white/5">
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
