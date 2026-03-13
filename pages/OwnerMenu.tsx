
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X, Save, Upload, Image as ImageIcon, Eye, EyeOff, Loader2, Layers } from 'lucide-react';
import { Business, PlanType, Product, Category } from '../types';
import { compressImage } from '../utils/image';
import { supabase, uploadImage } from '../lib/supabase';
import OptimizedImage from '../components/OptimizedImage';
import { sanitizeString } from '../utils/security';

const OwnerMenu: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('Todas');
  
  // Product States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Category States
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    categoryId: business.categories[0]?.id || '',
    imageUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=400',
    isVisible: true
  });

  // Category Handlers
  const openCreateCatModal = () => {
    const maxCategories = business.plan === PlanType.FREE ? 3 : Infinity;
    if (business.categories.length >= maxCategories) {
      alert(`Tu plan actual (${business.plan}) solo permite hasta ${maxCategories} categorías. ¡Sube a PRO para categorías ilimitadas!`);
      return;
    }
    setEditingCategory(null);
    setCatName('');
    setIsCatModalOpen(true);
  };

  const openEditCatModal = (category: Category) => {
    setEditingCategory(category);
    setCatName(category.name);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsSavingCat(true);

    try {
      const categoryData = {
        id: editingCategory?.id || Math.random().toString(36).substr(2, 9),
        business_id: business.id,
        name: sanitizeString(catName)
      };

      const { error } = await supabase.from('categories').upsert(categoryData);
      if (error) throw error;

      let updatedCategories;
      if (editingCategory) {
        updatedCategories = business.categories.map(c => c.id === editingCategory.id ? (categoryData as Category) : c);
      } else {
        updatedCategories = [...business.categories, categoryData as Category];
      }
      
      onUpdate({ ...business, categories: updatedCategories });
      setIsCatModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la categoría');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (business.categories.length <= 1) {
      alert('Debes tener al menos una categoría en tu menú.');
      return;
    }
    if (window.confirm('¿Eliminar esta categoría definitivamente? Los productos dejarán de estar asignados a esta sección.')) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;

        const updatedCategories = business.categories.filter(c => c.id !== id);
        onUpdate({ ...business, categories: updatedCategories });
      } catch (err) {
        console.error(err);
        alert('Error al eliminar la categoría');
      }
    }
  };

  // Product Handlers
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
        business_id: business.id,
        name: sanitizeString(formData.name),
        price: parseFloat(formData.price),
        description: sanitizeString(formData.description),
        category_id: formData.categoryId,
        image_url: formData.imageUrl,
        is_visible: formData.isVisible
      };

      const { error } = await supabase.from('products').upsert(productData);
      if (error) throw error;

      const localProduct: Product = {
        id: productData.id,
        name: productData.name,
        price: productData.price,
        description: productData.description,
        categoryId: productData.category_id,
        imageUrl: productData.image_url,
        isVisible: productData.is_visible
      };

      let updatedProducts;
      if (editingProduct) {
        updatedProducts = business.products.map(p => p.id === editingProduct.id ? localProduct : p);
      } else {
        updatedProducts = [localProduct, ...business.products];
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
      const { error } = await supabase.from('products').update({ is_visible: newVisibility }).eq('id', id);
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
    const maxProducts = business.plan === PlanType.FREE ? 10 : Infinity;
    if (business.products.length >= maxProducts) {
      alert(`Tu plan actual (${business.plan}) solo permite hasta ${maxProducts} productos. ¡Sube a PRO para productos ilimitados!`);
      return;
    }
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
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2 uppercase tracking-tighter">Gestión de Menú</h1>
          <p className="text-gray-500 font-semibold uppercase tracking-widest text-[10px]">Organiza tus categorías y productos</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={openCreateCatModal} className="flex-1 md:flex-none bg-white/5 text-white px-6 py-4 rounded-2xl font-extrabold text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <Layers size={18} /> Nueva Categoría
          </button>
          <button onClick={openNewProductModal} className="flex-1 md:flex-none bg-amber-500 text-black px-6 py-4 rounded-2xl font-extrabold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-amber-500/10 hover:bg-amber-400 transition-all">
            <Plus size={18} strokeWidth={3} /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Categories Section - Organic Integration */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-white font-extrabold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <Layers size={14} className="text-amber-500" /> Categorías
          </h2>
          <span className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest">{business.categories.length} Secciones</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {business.categories.map((cat, index) => (
            <div key={cat.id} className="bg-[#141416] border border-white/5 p-5 rounded-[2rem] flex items-center gap-4 group hover:border-amber-500/30 transition-all shadow-xl">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-extrabold text-sm uppercase tracking-tight truncate">{cat.name}</h3>
                <p className="text-gray-500 text-[9px] uppercase tracking-widest font-extrabold">
                  {business.products.filter(p => p.categoryId === cat.id).length} productos
                </p>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditCatModal(cat)}
                  className="p-2.5 bg-white/5 text-gray-400 rounded-xl hover:text-white transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-8 pt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-2 border-t border-white/5 pt-12">
          <h2 className="text-white font-extrabold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
            <Plus size={14} className="text-amber-500" /> Productos
          </h2>
          
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-white text-xs font-semibold focus:border-amber-500/50 outline-none transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-white text-xs font-semibold focus:border-amber-500/50 outline-none appearance-none cursor-pointer min-w-[140px]"
              value={selectedCatId}
              onChange={e => setSelectedCatId(e.target.value)}
            >
              <option value="Todas">Todas las categorías</option>
              {business.categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className={`bg-[#141416] border ${product.isVisible ? 'border-white/5' : 'border-red-500/20 opacity-75'} rounded-[2.5rem] overflow-hidden group flex h-44 shadow-2xl transition-all hover:border-white/10`}>
               <div className="relative w-44 shrink-0 bg-black overflow-hidden">
                 <OptimizedImage src={product.imageUrl} containerClassName="w-full h-full" className="group-hover:scale-110 transition-transform duration-700" alt={product.name} sizes="(max-width: 768px) 100vw, 176px" />
                 {!product.isVisible && <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"><EyeOff size={24} className="text-white/50" /></div>}
               </div>
               <div className="p-7 flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="text-white font-extrabold text-lg truncate uppercase tracking-tight leading-none mb-1">{product.name}</h3>
                      <p className="text-gray-500 text-[9px] uppercase font-extrabold tracking-[0.2em] truncate mb-2">
                        {business.categories.find(c => c.id === product.categoryId)?.name || 'Sin categoría'}
                      </p>
                      <span className="text-amber-500 font-extrabold text-xl tracking-tighter leading-none">${product.price}</span>
                    </div>
                    <button onClick={() => toggleVisibility(product.id)} className={`shrink-0 p-3 rounded-2xl transition-all ${product.isVisible ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'}`}>
                      {product.isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditProductModal(product)} className="flex-1 bg-white/5 text-white py-3 rounded-2xl text-[10px] uppercase font-extrabold tracking-widest border border-white/5 hover:bg-white hover:text-black transition-all">Editar</button>
                    <button 
                      onClick={() => handleDelete(product.id)} 
                      disabled={isDeleting === product.id}
                      className="px-5 bg-red-500/10 text-red-500 py-3 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                    >
                      {isDeleting === product.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
               </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                <Search size={32} />
              </div>
              <p className="text-gray-500 font-extrabold text-xs uppercase tracking-widest">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-[3rem] w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-tighter">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div 
                className="relative w-full h-56 rounded-[2rem] overflow-hidden bg-black border-2 border-dashed border-white/10 flex items-center justify-center group cursor-pointer hover:border-amber-500/50 transition-all" 
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="animate-spin text-amber-500" size={40} />
                ) : (
                  <OptimizedImage src={formData.imageUrl} containerClassName="w-full h-full" alt="Previsualización" sizes="100vw" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-extrabold text-xs uppercase tracking-widest transition-opacity backdrop-blur-sm">
                  Cambiar Imagen
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest ml-2">Nombre del Producto</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 text-white focus:border-amber-500 outline-none text-sm font-semibold transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Pizza Margarita" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest ml-2">Precio (CUP)</label>
                    <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 text-white focus:border-amber-500 outline-none text-sm font-semibold transition-all" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Ej: 850" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest ml-2">Categoría</label>
                  <select 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 text-white focus:border-amber-500 outline-none text-sm font-semibold appearance-none cursor-pointer transition-all"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="" disabled>Selecciona una categoría</option>
                    {business.categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest ml-2">Descripción</label>
                  <textarea 
                    rows={3} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 text-white focus:border-amber-500 outline-none text-sm font-semibold resize-none transition-all"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe los ingredientes o detalles..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={isSaving || isUploading} className="w-full bg-amber-500 text-black font-extrabold py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 disabled:opacity-50 text-xs uppercase tracking-[0.2em]">
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0a0a0b] border border-white/10 rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-8 border-b border-white/5">
              <h2 className="text-2xl font-extrabold text-white uppercase tracking-tighter">{editingCategory ? 'Editar' : 'Nueva'} Categoría</h2>
              <button onClick={() => setIsCatModalOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest ml-2">Nombre de la Categoría</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4.5 px-6 text-white focus:border-amber-500 outline-none text-sm font-semibold transition-all"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="Ej: Entrantes, Bebidas..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSavingCat}
                  className="w-full bg-amber-500 text-black font-extrabold py-5 rounded-[1.5rem] flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 disabled:opacity-50 text-xs uppercase tracking-[0.2em]"
                >
                  {isSavingCat ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
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
