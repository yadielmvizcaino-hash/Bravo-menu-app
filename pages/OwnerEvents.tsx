
import React, { useState, useRef } from 'react';
import { Plus, Crown, Calendar as CalendarIcon, Trash2, Edit2, Users, Clock, X, Save, Upload, Loader2 } from 'lucide-react';
import { Business, PlanType, Event } from '../types';
import { Link } from 'react-router-dom';
import { compressImage } from '../utils/image';
import { supabase, uploadImage } from '../lib/supabase';

const OwnerEvents: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dateTime: '',
    imageUrl: '',
    price: ''
  });

  const isPro = business.plan === PlanType.PRO;

  if (!isPro) {
    return (
      <div className="max-w-7xl mx-auto h-[70vh] flex flex-col items-center justify-center text-center px-6">
         <div className="w-24 h-24 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mb-6 border border-amber-500/20 shadow-2xl">
           <CalendarIcon size={48} />
         </div>
         <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">Gestor de Eventos</h1>
         <p className="text-gray-500 max-w-lg mb-10 text-lg leading-relaxed">Organiza noches temáticas y promociones especiales. Función exclusiva del Plan PRO.</p>
         <Link to="/admin/pricing" className="bg-amber-500 text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10">Actualizar a PRO</Link>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 1000, 0.7);
      const url = await uploadImage(compressed, `events/${business.id}`);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      alert('Error al subir la foto del evento');
    } finally {
      setIsUploading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({ title: '', description: '', dateTime: '', imageUrl: '', price: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setFormData({ 
      title: event.title, 
      description: event.description, 
      dateTime: event.dateTime.substring(0, 16), 
      imageUrl: event.imageUrl,
      price: event.price?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert('Debes subir una imagen');
    setIsSaving(true);

    try {
      const eventData = {
        id: editingEvent?.id || Math.random().toString(36).substr(2, 9),
        businessId: business.id,
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        interestedCount: editingEvent?.interestedCount || 0
      };

      const { error } = await supabase.from('events').upsert(eventData);
      if (error) throw error;

      let updatedEvents;
      if (editingEvent) {
        updatedEvents = business.events.map(ev => ev.id === editingEvent.id ? (eventData as Event) : ev);
      } else {
        updatedEvents = [eventData as Event, ...business.events];
      }
      
      onUpdate({ ...business, events: updatedEvents });
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al guardar el evento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar evento definitivamente?')) {
      setIsDeleting(id);
      try {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;

        const updatedEvents = business.events.filter(e => e.id !== id);
        onUpdate({ ...business, events: updatedEvents });
      } catch (err) {
        alert('Error al eliminar el evento');
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Eventos</h1>
          <p className="text-gray-500 font-medium">{business.events.length} eventos programados</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10"
        >
          <Plus size={20} strokeWidth={3} /> Nuevo evento
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {business.events.map(event => (
           <div key={event.id} className="bg-[#1a1a1c] border border-gray-800 rounded-3xl overflow-hidden group hover:border-amber-500/30 transition-all shadow-2xl flex flex-col">
              <div className="relative h-64 bg-gray-900">
                 <img src={event.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={event.title} />
                 <div className="absolute top-6 right-6 flex gap-2">
                    <button onClick={() => openEditModal(event)} className="p-3 bg-black/60 backdrop-blur-md text-white rounded-xl hover:bg-amber-500 hover:text-black transition-all shadow-2xl"><Edit2 size={18} /></button>
                    <button 
                      onClick={() => handleDelete(event.id)} 
                      disabled={isDeleting === event.id}
                      className="p-3 bg-red-500/80 text-white rounded-xl hover:bg-red-600 transition-all shadow-2xl disabled:opacity-50"
                    >
                      {isDeleting === event.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                 </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                 <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tight leading-tight">{event.title}</h3>
                 <div className="flex flex-wrap gap-5 text-gray-500 text-[10px] font-black uppercase tracking-widest mb-6">
                    <span className="flex items-center gap-2"><CalendarIcon size={16} className="text-amber-500" /> {new Date(event.dateTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-2"><Clock size={16} className="text-amber-500" /> {new Date(event.dateTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                    <span className="flex items-center gap-2"><Users size={16} className="text-amber-500" /> {event.interestedCount} interesados</span>
                 </div>
                 <p className="text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed font-light">{event.description}</p>
                 <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-amber-500 font-black text-lg tracking-tight">{event.price ? `$${event.price} CUP` : 'Entrada Libre'}</span>
                 </div>
              </div>
           </div>
         ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-8 border-b border-gray-800">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{editingEvent ? 'Editar' : 'Nuevo'} Evento</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Flyer / Cartel</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-52 rounded-2xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center group cursor-pointer hover:border-amber-500/50 transition-all"
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin text-amber-500" size={32} />
                  ) : formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto text-gray-600 mb-2" size={32} />
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Sube la foto del evento</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black uppercase">Cambiar</div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nombre</label>
                  <input required type="text" className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Fecha y Hora</label>
                  <input required type="datetime-local" className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm" value={formData.dateTime} onChange={e => setFormData({...formData, dateTime: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Precio (CUP)</label>
                  <input type="number" className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0 (Libre)" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Descripción</label>
                <textarea required rows={4} className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none resize-none text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={isSaving || isUploading} className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest">
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerEvents;
