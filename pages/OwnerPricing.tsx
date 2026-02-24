
import React, { useState } from 'react';
import { Crown, Check, X, ShieldCheck, CreditCard, Copy, CheckCircle2 } from 'lucide-react';
import { Business, PlanType } from '../types';

const OwnerPricing: React.FC<{ business: Business }> = ({ business }) => {
  const isPro = business.plan === PlanType.PRO;
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const paymentCode = "CZ-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Modal de Pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1c] border border-gray-700 rounded-3xl p-8 max-w-lg w-full relative">
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500 text-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">💎 Actualizar a PRO</h2>
              <p className="text-gray-400">Generando tu código de activación único...</p>
            </div>

            <div className="bg-[#242426] p-6 rounded-2xl border border-amber-500/30 mb-8 text-center">
               <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mb-2">Tu código de pago</p>
               <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-white tracking-widest">{paymentCode}</span>
                  <button className="text-amber-500 hover:text-amber-400 p-1">
                    <Copy size={18} />
                  </button>
               </div>
            </div>

            <div className="space-y-6 mb-8">
               <h3 className="text-white font-bold flex items-center gap-2">
                 <CheckCircle2 size={18} className="text-green-500" /> Instrucciones de pago:
               </h3>
               <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-5">
                 <li>Paga <b>500 CUP</b> mediante EnZona al comercio: <b>CubaGastroHub</b></li>
                 <li>O realiza una transferencia bancaria a la tarjeta: <b className="text-white">9227 0699 9426 7907</b></li>
                 <li>Envía el comprobante por WhatsApp al: <b className="text-green-400">+53 59631292</b></li>
                 <li><b className="text-white">IMPORTANTE:</b> Incluye tu código {paymentCode} en el mensaje.</li>
               </ol>
               <p className="text-xs text-gray-500 italic">Tu plan PRO se activará en un máximo de 24 horas tras recibir el comprobante.</p>
            </div>

            <button 
              onClick={() => setShowPaymentModal(false)}
              className="w-full bg-amber-500 text-black font-bold py-4 rounded-xl hover:bg-amber-400"
            >
              Entendido, ya realicé el pago
            </button>
          </div>
        </div>
      )}

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Plan</h1>
      </div>

      <div className="bg-[#1a1a1c] border border-gray-800 rounded-3xl p-8 mb-12 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
               <Crown size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{isPro ? 'Plan PRO' : 'Plan Gratis'}</span>
                <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded">Activo</span>
              </div>
              <p className="text-gray-500 text-sm">Válido hasta: {isPro ? '15 de marzo, 2026' : 'Indefinido'}</p>
            </div>
         </div>
         {isPro && (
           <button className="text-gray-400 text-sm hover:underline">Gestionar suscripción</button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className={`bg-[#1a1a1c] border rounded-3xl p-8 flex flex-col ${!isPro ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'border-gray-800'}`}>
           <h3 className="text-xl font-bold text-white mb-2">Plan Gratis</h3>
           <p className="text-gray-500 mb-6">Básico para presencia digital</p>
           <div className="text-4xl font-bold text-white mb-10">$0 <span className="text-lg font-normal text-gray-500">CUP/mes</span></div>
           
           <ul className="space-y-4 mb-10 flex-1">
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-green-500" /> Perfil básico</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-green-500" /> Hasta 10 productos</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-green-500" /> QR estándar</li>
             <li className="flex items-center gap-3 text-gray-600"><X size={18} /> Banners publicitarios</li>
             <li className="flex items-center gap-3 text-gray-600"><X size={18} /> Gestor de eventos</li>
             <li className="flex items-center gap-3 text-gray-600"><X size={18} /> Estadísticas avanzadas</li>
           </ul>
           
           {!isPro ? (
             <div className="text-center py-4 text-amber-500 font-bold">Tu plan actual</div>
           ) : (
             <button className="bg-[#242426] text-white py-4 rounded-xl font-bold opacity-50 cursor-not-allowed">Plan actual</button>
           )}
        </div>

        <div className={`bg-[#1a1a1c] border rounded-3xl p-8 flex flex-col relative overflow-hidden ${isPro ? 'border-amber-500/50 ring-2 ring-amber-500/10' : 'border-gray-800'}`}>
           <div className="absolute top-4 right-[-40px] bg-amber-500 text-black font-bold text-[10px] px-12 py-1 rotate-45 uppercase tracking-tighter">Súper Popular</div>
           <h3 className="text-xl font-bold text-white mb-2">Plan PRO</h3>
           <p className="text-gray-500 mb-6">Para negocios premium</p>
           <div className="text-4xl font-bold text-amber-500 mb-10">$500 <span className="text-lg font-normal text-gray-500">CUP/mes</span></div>
           
           <ul className="space-y-4 mb-10 flex-1">
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-amber-500" /> Productos ILIMITADOS</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-amber-500" /> Sistema de Banners</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-amber-500" /> Gestor de Eventos</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-amber-500" /> QR con tu Logo</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-amber-500" /> Leads de WhatsApp</li>
             <li className="flex items-center gap-3 text-gray-300"><Check size={18} className="text-amber-500" /> Soporte Prioritario</li>
           </ul>
           
           {!isPro ? (
             <button onClick={() => setShowPaymentModal(true)} className="bg-amber-500 text-black py-4 rounded-xl font-bold hover:bg-amber-400 transition-all scale-100 hover:scale-[1.02]">Actualizar a PRO</button>
           ) : (
             <div className="text-center py-4 text-amber-500 font-bold flex items-center justify-center gap-2">
               <ShieldCheck size={20} /> Plan PRO Activo
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default OwnerPricing;
