
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X, Save, Upload, Image as ImageIcon, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Business, PlanType, Product } from '../types';
import { compressImage } from '../utils/image';
import { supabase, uploadImage } from '../lib/supabase';

const OwnerMenu: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: business.categories[0]?.id || '',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400',
    isVisible: true
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file, 800, 0.7);
      const url = await uploadImage(compressed, `products/${business.id}`);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      alert("Error al subir imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const productData = {
        id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
        businessId: business.id,
        ...formData,
        price: parseFloat(formData.price)
      };

      const { error } = await supabase.from('products').upsert(productData);
      if (error) throw error;

      let updatedProducts;
      if (editingProduct) {
        updatedProducts = business.products.map(p => p.id === editingProduct.id ? (productData as Product) : p);
      } else {
        updatedProducts = [productData as Product, ...business.products];
      }
      
      onUpdate({ ...business, products: updatedProducts });
      setIsModalOpen(false);
    } catch (err) {
      alert("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar producto definitivamente?')) return;
    
    setIsDeleting(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      
      const updatedProducts = business.products.filter(p => p.id !== id);
      // Notificamos al padre para actualizar el estado global
      onUpdate({ ...business, products: updatedProducts });
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Error al eliminar el producto");
    } finally {
      setIsDeleting(null);
    }
  };

  const toggleVisibility = async (id: string) => {
    const prod = business.products.find(p => p.id === id);
    if (!prod) return;
    const newVisibility = !prod.isVisible;
    try {
      const { error } = await supabase.from('products').update({ isVisible: newVisibility }).eq('id', id);
      if (!error) {
        onUpdate({ ...business, products: business.products.map(p => p.id === id ? { ...p, isVisible: newVisibility } : p) });
      }
    } catch (err) {
      alert("No se pudo cambiar la visibilidad");
    }
  };

  const filteredProducts = useMemo(() => {
    return business.products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCatId === 'Todas' || p.categoryId === selectedCatId;
      return matchesSearch && matchesCat;
    });
  }, [business.products, searchTerm, selectedCatId]);

  const openNewProductModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      categoryId: business.categories[0]?.id || '',
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400',
      isVisible: true
    });
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      isVisible: product.isVisible ?? true
    });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 uppercase tracking-tight">Productos</h1>
          <p className="text-gray-500 font-medium">{business.products.length} productos registrados</p>
        </div>
        <button onClick={openNewProductModal} className="w-full md:w-auto bg-amber-500 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 hover:bg-amber-400 transition-all">
          <Plus size={20} strokeWidth={3} /> Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className={`bg-[#1a1a1c] border ${product.isVisible ? 'border-gray-800' : 'border-red-500/20 opacity-75'} rounded-3xl overflow-hidden group flex h-40 shadow-xl transition-all`}>
             <div className="relative w-40 shrink-0 bg-gray-900">
               <img src={product.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
               {!product.isVisible && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><EyeOff size={24} className="text-white/50" /></div>}
             </div>
             <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="overflow-hidden pr-2">
                    <h3 className="text-white font-bold text-base truncate uppercase tracking-tight">{product.name}</h3>
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-[0.15em] truncate mb-1">
                      {business.categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                    </p>
                    <span className="text-amber-500 font-black text-sm tracking-tight">${product.price}</span>
                  </div>
                  <button onClick={() => toggleVisibility(product.id)} className={`p-2 rounded-lg transition-colors ${product.isVisible ? 'text-amber-500 hover:bg-amber-500/10' : 'text-red-500 hover:bg-red-500/10'}`}>{product.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditProductModal(product)} className="flex-1 bg-gray-800 text-gray-400 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest border border-gray-700 hover:text-white hover:bg-gray-700 transition-all">Editar</button>
                  <button 
                    onClick={() => handleDelete(product.id)} 
                    disabled={isDeleting === product.id}
                    className="px-4 bg-red-500/10 text-red-500 py-2.5 rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                  >
                    {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-8 border-b border-gray-800">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar">
              <div 
                className="relative w-full h-48 rounded-2xl overflow-hidden bg-gray-800 border-2 border-dashed border-gray-700 flex items-center justify-center group cursor-pointer hover:border-amber-500/50" 
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="animate-spin text-amber-500" size={32} />
                ) : (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Previsualización" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs uppercase transition-opacity">
                  Cambiar Imagen
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nombre</label>
                    <input required type="text" className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Pizza Margarita" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Precio (CUP)</label>
                    <input required type="number" className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ej: 850" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Categoría</label>
                  <select 
                    required 
                    className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm appearance-none cursor-pointer"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {business.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Descripción</label>
                  <textarea 
                    rows={3} 
                    className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-5 text-white focus:border-amber-500/50 outline-none text-sm resize-none"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe los detalles especiales..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isSaving || isUploading} className="w-full bg-amber-500 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 text-xs uppercase tracking-widest">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerMenu;
