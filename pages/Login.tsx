
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, Loader2, Zap, AlertCircle, LogIn, PlusCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login: React.FC<{ onLogin: (id: string) => void }> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('businesses')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        onLogin(data.id);
        navigate('/admin');
      } else {
        setError('No se encontró ningún negocio con este número de teléfono.');
      }
    } catch (err: any) {
      setError('Error al intentar acceder. Por favor, reintenta.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-amber-500/20">
            <Zap size={14} fill="currentColor" /> Acceso para Dueños
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Gestiona tu Menú</h1>
          <p className="text-gray-500 text-sm font-medium">Ingresa el número de teléfono que registraste.</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#141416] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Teléfono / WhatsApp</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">+53</span>
              <input 
                required
                type="tel" 
                placeholder="5XXXXXXX"
                maxLength={8}
                className="w-full bg-[#1a1a1c] border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-amber-500/50 outline-none transition-all font-mono tracking-widest"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-500 text-xs animate-fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <p className="font-bold">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || phone.length < 8}
            className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50 group"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Entrar a mi menú <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
          </button>

          <div className="text-center pt-4 border-t border-white/5">
            <p className="text-gray-500 text-xs mb-4">¿Aún no tienes un menú digital?</p>
            <Link 
              to="/crear-negocio" 
              className="inline-flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              <PlusCircle size={14} /> Crear mi perfil ahora
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
