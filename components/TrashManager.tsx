
import React from 'react';
import { TrashItem, Sale, Customer } from '../types';

interface TrashManagerProps {
  trashItems: TrashItem[];
  customers: Customer[];
  onRestore: (id: string) => void;
  onDeletePermanent: (id: string) => void;
}

const TrashManager: React.FC<TrashManagerProps> = ({ trashItems, customers, onRestore, onDeletePermanent }) => {
  const getDaysRemaining = (deletedAt: number) => {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const expirationDate = deletedAt + thirtyDaysInMs;
    const remainingMs = expirationDate - Date.now();
    return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 uppercase italic">Lixeira de Vendas</h2>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Itens aqui serão apagados permanentemente após 30 dias.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {trashItems.map((item) => {
          const daysLeft = getDaysRemaining(item.deletedAt);
          const customer = customers.find(c => c.id === item.sale.customerId);
          
          return (
            <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded uppercase">Excluído</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase italic">Expira em {daysLeft} dias</span>
                </div>
                <h3 className="font-black text-slate-800 uppercase">{customer?.name || '🛒 Venda Balcão'}</h3>
                <p className="text-xs text-slate-500">{item.sale.description} • {formatCurrency(item.sale.totalAmount)}</p>
                <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold">Vendido em: {new Date(item.sale.date).toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onRestore(item.id)}
                  className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition"
                >
                  Restaurar
                </button>
                <button 
                  onClick={() => { if(confirm('Apagar permanentemente agora?')) onDeletePermanent(item.id); }}
                  className="p-2 text-slate-300 hover:text-rose-600 transition"
                  title="Excluir Permanentemente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}

        {trashItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Sua lixeira está vazia</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashManager;
