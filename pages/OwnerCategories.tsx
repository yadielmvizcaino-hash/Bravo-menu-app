
import React, { useState } from 'react';
import { Plus, GripVertical, Edit2, Trash2, Layers, X, Save, Loader2 } from 'lucide-react';
import { Business, Category } from '../types';
import { supabase } from '../lib/supabase';

const OwnerCategories: React.FC<{ business: Business, onUpdate: (b: Business) => void }> = ({ business, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const openCreateModal = () => {
    setEditingCategory(null);
    setCatName('');
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCatName(category.name);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsSaving(true);

    try {
      const categoryData = {
        id: editingCategory?.id || Math.random().toString(36).substr(2, 9),
        businessId: business.id,
        name: catName.trim()
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
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la categoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Categorías</h1>
          <p className="text-gray-500">Organiza los productos de tu menú en secciones sincronizadas</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="w-full md:w-auto bg-amber-500 text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10"
        >
          <Plus size={20} /> Nueva categoría
        </button>
      </div>

      <div className="bg-[#1a1a1c] border border-gray-800 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="p-6 md:p-8">
          <div className="space-y-3">
            {business.categories.map((cat, index) => (
              <div key={cat.id} className="bg-[#242426] border border-gray-700 p-4 rounded-2xl flex items-center gap-4 group hover:border-amber-500/30 transition-all">
                <div className="text-gray-600 cursor-grab hover:text-gray-400 transition-colors">
                  <GripVertical size={20} />
                </div>
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">{cat.name}</h3>
                  <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                    {business.products.filter(p => p.categoryId === cat.id).length} productos
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(cat)}
                    className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:text-white transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {business.categories.length === 0 && (
              <div className="text-center py-10 text-gray-500">No hay categorías. Crea una para empezar.</div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1a1a1c] border border-gray-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">{editingCategory ? 'Renombrar Categoría' : 'Nueva Categoría'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nombre</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="w-full bg-[#242426] border border-gray-700 rounded-xl py-4 px-4 text-white focus:border-amber-500/50 outline-none"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
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

export default OwnerCategories;
