
import React from 'react';
import { Users, Search, Filter, Download, MessageCircle, MoreVertical, QrCode, Globe, Calendar as CalendarIcon } from 'lucide-react';
import { Business } from '../types';

const OwnerLeads: React.FC<{ business: Business }> = ({ business }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Mis Clientes</h1>
          <p className="text-gray-500 text-sm">Contactos captados a través de tu menú digital</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#1a1a1c] text-white border border-gray-800 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all text-sm">
            <Download size={20} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#1a1a1c] p-6 rounded-[2rem] border border-gray-800">
           <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-4">
              <Users size={24} />
           </div>
           <p className="text-gray-500 text-sm mb-1">Total de Leads</p>
           <h3 className="text-3xl font-bold text-white">{business.leads.length}</h3>
        </div>
        <div className="bg-[#1a1a1c] p-6 rounded-[2rem] border border-gray-800">
           <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-4">
              <QrCode size={24} />
           </div>
           <p className="text-gray-500 text-sm mb-1">Desde Código QR</p>
           <h3 className="text-3xl font-bold text-white">84%</h3>
        </div>
        <div className="bg-[#1a1a1c] p-6 rounded-[2rem] border border-gray-800">
           <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
              <CalendarIcon size={24} />
           </div>
           <p className="text-gray-500 text-sm mb-1">Conversión Semanal</p>
           <h3 className="text-3xl font-bold text-white">+12.5%</h3>
        </div>
      </div>

      <div className="bg-[#1a1a1c] border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4 mb-10">
           <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
             <input type="text" placeholder="Buscar por nombre o teléfono..." className="w-full bg-[#242426] border border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-amber-500 transition-all outline-none text-sm" />
           </div>
           <div className="flex gap-2">
              <button className="bg-amber-500 text-black px-8 py-4 rounded-2xl font-bold shadow-lg shadow-amber-500/10 text-xs">Todos</button>
              <button className="bg-[#242426] text-gray-400 border border-gray-800 px-8 py-4 rounded-2xl font-bold hover:text-white transition-all text-xs">Solo QR</button>
           </div>
        </div>

        {business.leads.length > 0 ? (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="text-gray-500 text-xs uppercase tracking-widest border-b border-gray-800">
                  <tr>
                    <th className="pb-6 font-bold">Cliente</th>
                    <th className="pb-6 font-bold">Información de Contacto</th>
                    <th className="pb-6 font-bold">Origen</th>
                    <th className="pb-6 font-bold">Fecha de Captación</th>
                    <th className="pb-6 font-bold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                   {business.leads.map(lead => (
                     <tr key={lead.id} className="border-b border-gray-800/50 hover:bg-[#242426]/30 group transition-all">
                        <td className="py-7">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center font-bold text-sm">
                                 {lead.name.charAt(0)}
                              </div>
                              <span className="font-bold text-sm">{lead.name}</span>
                           </div>
                        </td>
                        <td className="py-7 font-mono text-amber-500/80 text-sm">{lead.phone}</td>
                        <td className="py-7">
                           <span className="bg-blue-500/10 text-blue-500 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
                              <QrCode size={12} /> Escaneo QR
                           </span>
                        </td>
                        <td className="py-7 text-gray-500 text-sm">{lead.date}</td>
                        <td className="py-7">
                           <div className="flex justify-end gap-2">
                              <button className="p-3 bg-green-500/10 text-green-500 rounded-xl hover:bg-green-500 hover:text-white transition-all">
                                <MessageCircle size={18} />
                              </button>
                              <button className="p-3 bg-gray-800 text-gray-400 rounded-xl hover:text-white transition-all">
                                <MoreVertical size={18} />
                              </button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-gray-500">
             <div className="w-20 h-20 bg-gray-800/50 rounded-[2rem] flex items-center justify-center mb-6">
                <Users size={40} className="opacity-20" />
             </div>
             <p className="text-xl font-bold mb-1 text-white">Tu base de datos está vacía</p>
             <p className="text-sm max-w-xs text-center leading-relaxed">Los leads aparecerán aquí automáticamente cuando los clientes acepten compartir su información al entrar a tu menú.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerLeads;
