
import React, { useState } from 'react';
import { Sale, Customer, Expense } from '../types';

interface RefundManagerProps {
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  onRefund: (id: string) => void;
  onManualRefund: (description: string, amount: number) => void;
}

const RefundManager: React.FC<RefundManagerProps> = ({ sales, customers, expenses, onRefund, onManualRefund }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDesc, setManualDesc] = useState('');
  const [manualAmount, setManualAmount] = useState<number>(0);

  const totalRefundedInMonth = expenses
    .filter(e => e.category === 'refund')
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredSales = sales.filter(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    const searchStr = `${customer?.name || ''} ${sale.description} ${sale.totalAmount}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleRefundClick = (sale: Sale) => {
    const formattedVal = sale.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const isAvulsa = !sale.productId && (!sale.items || !sale.items.some(item => !!item.productId));
    
    const msg = isAvulsa 
      ? `⚠️ CONFIRMAR ESTORNO (ITEM AVULSO)\n\nValor: R$ ${formattedVal}\n\nO valor será registrado como saída de caixa para cálculo de venda real.`
      : `⚠️ CONFIRMAR ESTORNO (COM ESTOQUE)\n\nValor: R$ ${formattedVal}\n\nO item voltará ao estoque e o valor será subtraído da venda real.`;

    if (window.confirm(`${msg}\n\nDeseja prosseguir?`)) {
      onRefund(sale.id);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDesc || manualAmount <= 0) return;
    
    if (window.confirm(`⚠️ REGISTRAR ESTORNO MANUAL\n\nIsso impactará o resultado de Venda Real no Dashboard. Confirmar?`)) {
      onManualRefund(manualDesc, manualAmount);
      setManualDesc('');
      setManualAmount(0);
      setShowManualForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase italic">Central de Estornos</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Cruze dados para obter a Venda Real da sua loja.</p>
        </div>
        <button 
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg"
        >
          {showManualForm ? 'Cancelar' : 'Estorno Avulso (Manual)'}
        </button>
      </div>

      {/* Metric Overlay */}
      <div className="bg-rose-600 p-6 rounded-3xl shadow-xl text-white">
          <p className="text-rose-100 text-[10px] font-black uppercase tracking-widest mb-1">Total de Estornos (Mês)</p>
          <h3 className="text-3xl font-black">R$ {totalRefundedInMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <p className="text-[9px] text-rose-200 mt-2 font-bold uppercase tracking-tighter opacity-80">Este valor está sendo descontado do seu Faturamento Bruto.</p>
      </div>

      {showManualForm && (
        <form onSubmit={handleManualSubmit} className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
            Lançamento de Devolução (Venda Real)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Motivo do Estorno" 
              value={manualDesc}
              onChange={e => setManualDesc(e.target.value)}
              className="bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
            <input 
              type="number" 
              step="0.01" 
              placeholder="Valor Devolvido (R$)" 
              value={manualAmount || ''}
              onChange={e => setManualAmount(Number(e.target.value))}
              className="bg-white border border-amber-200 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
          </div>
          <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 transition">
            Confirmar e Abater do Faturamento
          </button>
        </form>
      )}

      <div className="relative">
        <input 
          type="text" 
          placeholder="Pesquisar venda registrada..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-500 outline-none pl-12 shadow-sm"
        />
        <svg className="w-5 h-5 absolute left-4 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSales.map(sale => {
          const customer = customers.find(c => c.id === sale.customerId);
          const totalPaid = sale.installments.reduce((acc, inst) => acc + inst.paidAmount, 0);
          const isAvulsa = !sale.productId && (!sale.items || !sale.items.some(item => !!item.productId));
          
          return (
            <div key={sale.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-1">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${sale.type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {sale.type === 'cash' ? 'À Vista' : 'A Prazo'}
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isAvulsa ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-700'}`}>
                      {isAvulsa ? '🛍️ Avulsa' : '📦 Estoque'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <h3 className="font-black text-slate-800 uppercase leading-tight group-hover:text-rose-600 transition-colors">
                  {customer?.name || '🛒 Cliente Balcão'}
                </h3>
                <p className="text-xs text-slate-500 mb-4 truncate">{sale.description}</p>
                
                <div className="space-y-2 mb-6 bg-slate-50 p-3 rounded-xl">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Valor Venda</span>
                    <span className="font-black text-slate-900">R$ {sale.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 font-bold uppercase tracking-tighter">Valor Pago</span>
                    <span className="font-black text-emerald-600">R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleRefundClick(sale)}
                className="w-full bg-rose-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition shadow-lg shadow-rose-100 active:scale-95"
              >
                Estornar Esta Venda
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RefundManager;
