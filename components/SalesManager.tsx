
import React, { useState, useEffect } from 'react';
import { Customer, Sale, PaymentStatus, Installment, Product } from '../types';

interface SalesManagerProps {
  sales: Sale[];
  customers: Customer[];
  products: Product[];
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onUpdateSale: (sale: Sale) => void;
  mode: 'cash' | 'credit';
}

const SalesManager: React.FC<SalesManagerProps> = ({ sales, customers, products, onAddSale, onUpdateSale, mode }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [isBalcao, setIsBalcao] = useState(false);
  const [productId, setProductId] = useState('');
  const [description, setDescription] = useState('');
  
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [cardFeeRate, setCardFeeRate] = useState<number>(0);
  const [currentProductCost, setCurrentProductCost] = useState<number>(0);
  
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [netAmount, setNetAmount] = useState<number>(0);

  const [numInstallments, setNumInstallments] = useState<number>(1);
  const [dueDay, setDueDay] = useState<number>(new Date().getDate());
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentValue, setPaymentValue] = useState<number>(0);

  // Sync price and cost when product is selected
  useEffect(() => {
    if (productId) {
      const p = products.find(prod => prod.id === productId);
      if (p) {
        setBaseAmount(p.price);
        setDescription(`${p.sku} - ${p.name}`);
        setCurrentProductCost(p.costPrice);
      }
    } else {
      setCurrentProductCost(0);
    }
  }, [productId, products]);

  useEffect(() => {
    const calculatedTotal = Math.max(0, baseAmount - discount);
    const feeAmount = (calculatedTotal * cardFeeRate) / 100;
    const calculatedNet = calculatedTotal - feeAmount;

    setTotalAmount(calculatedTotal);
    setNetAmount(calculatedNet);
  }, [baseAmount, discount, cardFeeRate]);

  const filteredSales = sales.filter(s => (s.type || 'credit') === mode);

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomerId = isBalcao ? 'BALCAO' : customerId;
    
    if (!finalCustomerId || !description || totalAmount <= 0) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (productId) {
      const p = products.find(prod => prod.id === productId);
      if (p && p.stock <= 0) {
        if (!window.confirm("Produto sem estoque! Deseja continuar com a venda mesmo assim?")) return;
      }
    }

    const installments: Installment[] = [];
    const today = new Date();
    const cardFeeAmount = (totalAmount * cardFeeRate) / 100;

    if (mode === 'cash') {
      installments.push({
        id: Math.random().toString(36).substr(2, 9),
        saleId: '', 
        amount: totalAmount,
        paidAmount: totalAmount,
        dueDate: today.toISOString().split('T')[0],
        status: PaymentStatus.PAID
      });
    } else {
      const installmentAmount = totalAmount / numInstallments;
      for (let i = 1; i <= numInstallments; i++) {
        const dueDate = calculateDueDate(today, i, dueDay);
        installments.push({
          id: Math.random().toString(36).substr(2, 9),
          saleId: '', 
          amount: installmentAmount,
          paidAmount: 0,
          dueDate: dueDate.toISOString().split('T')[0],
          status: PaymentStatus.PENDING
        });
      }
    }

    onAddSale({
      customerId: finalCustomerId,
      productId: productId || undefined,
      description,
      baseAmount,
      discount,
      totalAmount,
      cardFeeRate,
      cardFeeAmount,
      netAmount,
      totalCost: currentProductCost,
      date: today.toISOString().split('T')[0],
      installments,
      status: mode === 'cash' ? PaymentStatus.PAID : PaymentStatus.PENDING,
      type: mode
    });

    setShowAdd(false);
    resetForm();
  };

  const calculateDueDate = (baseDate: Date, monthsToAdd: number, targetDay: number) => {
    let targetMonth = baseDate.getMonth() + monthsToAdd;
    let targetYear = baseDate.getFullYear();
    while (targetMonth > 11) { targetMonth -= 12; targetYear += 1; }
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const actualDay = Math.min(targetDay, lastDayOfMonth);
    return new Date(targetYear, targetMonth, actualDay);
  };

  const resetForm = () => {
    setCustomerId('');
    setIsBalcao(false);
    setProductId('');
    setDescription('');
    setBaseAmount(0);
    setDiscount(0);
    setCardFeeRate(0);
    setCurrentProductCost(0);
    setNumInstallments(1);
    setDueDay(new Date().getDate());
  };

  const calculateSaleStatus = (installments: Installment[]) => {
    const allPaid = installments.every(i => i.status === PaymentStatus.PAID);
    const somePaid = installments.some(i => i.status !== PaymentStatus.PENDING);
    return allPaid ? PaymentStatus.PAID : (somePaid ? PaymentStatus.PARTIAL : PaymentStatus.PENDING);
  };

  const accentColor = mode === 'cash' ? 'emerald' : 'indigo';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">{mode === 'cash' ? 'Venda À Vista' : 'Venda a Prazo'}</h2>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Lançamento de {mode === 'cash' ? 'entrada imediata' : 'parcelamentos'}</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`bg-${accentColor}-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-${accentColor}-700 transition shadow-sm`}
        >
          {showAdd ? 'Cancelar' : 'Nova Venda'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddSale} className={`bg-white p-6 rounded-2xl shadow-sm border border-${accentColor}-100 space-y-6 animate-in fade-in zoom-in duration-200`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Cliente</label>
                <button type="button" onClick={() => setIsBalcao(!isBalcao)} className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${isBalcao ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isBalcao ? '✓ Venda Balcão' : 'Venda Balcão?'}
                </button>
              </div>
              {isBalcao ? (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700 font-bold">🛒 Cliente Balcão</div>
              ) : (
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Selecione o Cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Produto (SKU - Nome)</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                  <option value="">-- Venda Avulsa / Sem Código --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Qtd: {p.stock})</option>)}
              </select>
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição do Item</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Camiseta Básica P" />
            </div>

            <div className="space-y-4 md:col-span-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Preço Venda (R$)</label>
                    <input type="number" step="0.01" value={baseAmount || ''} onChange={e => setBaseAmount(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Desconto (R$)</label>
                    <input type="number" step="0.01" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-rose-600 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Taxa Cartão (%)</label>
                    <input type="number" step="0.1" value={cardFeeRate || ''} onChange={e => setCardFeeRate(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-amber-600 font-bold" />
                  </div>
                  <div className="flex flex-col justify-end">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Cliente</p>
                    <p className="text-xl font-black text-slate-900">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">
                     Custo Unitário Registrado: <span className="text-rose-600 font-bold">R$ {currentProductCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right text-emerald-600 font-bold text-sm">
                    Líquido Real: R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
               </div>
            </div>

            {mode === 'credit' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Parcelas</label>
                  <input type="number" min="1" max="24" value={numInstallments} onChange={e => setNumInstallments(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dia Venc.</label>
                  <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-50">
            <button type="submit" className={`px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition shadow-lg bg-${accentColor}-600 text-white hover:bg-${accentColor}-700`}>
              Confirmar Venda {mode === 'cash' ? 'À Vista' : 'a Prazo'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredSales.map(sale => {
           const saleProfit = sale.netAmount - sale.totalCost;
           const profitMargin = sale.netAmount > 0 ? (saleProfit / sale.netAmount) * 100 : 0;
           
           return (
            <div key={sale.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:border-indigo-200 transition">
               <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 p-2 rounded-lg ${sale.customerId === 'BALCAO' ? 'bg-amber-100 text-amber-600' : mode === 'cash' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 leading-tight">{customers.find(c => c.id === sale.customerId)?.name || '🛒 Cliente Balcão'}</h3>
                      <p className="text-xs text-slate-500 mb-1">{sale.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase text-slate-400">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                        <div className="flex items-center gap-1.5">
                           <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${saleProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                             Lucro: R$ {saleProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </span>
                           <span className="text-[10px] font-bold text-slate-300">({profitMargin.toFixed(0)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900 leading-none mb-1">R$ {sale.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-tighter ${sale.status === PaymentStatus.PAID ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>{sale.status}</span>
                    </div>
                    <button onClick={() => setSelectedSale(selectedSale?.id === sale.id ? null : sale)} className="p-2 text-slate-400 hover:text-indigo-600 transition">
                       <svg className={`w-5 h-5 transition-transform duration-300 ${selectedSale?.id === sale.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
               </div>

               {selectedSale?.id === sale.id && (
                  <div className="px-5 pb-5 pt-4 border-t border-slate-50 bg-slate-50/50 animate-in slide-in-from-top-1 duration-200">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                           <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Faturamento Bruto</p>
                           <p className="text-sm font-bold text-slate-700">R$ {sale.baseAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                           <p className="text-[9px] font-bold text-indigo-400 uppercase mb-1">Líquido (Pós Taxas)</p>
                           <p className="text-sm font-bold text-indigo-600">R$ {sale.netAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                           <p className="text-[9px] font-bold text-rose-400 uppercase mb-1">Custo do Produto</p>
                           <p className="text-sm font-bold text-rose-500">R$ {sale.totalCost.toFixed(2)}</p>
                        </div>
                        <div className="bg-emerald-600 p-3 rounded-xl shadow-md">
                           <p className="text-[9px] font-bold text-emerald-100 uppercase mb-1">Ganho Real (Lucro)</p>
                           <p className="text-sm font-black text-white">R$ {saleProfit.toFixed(2)}</p>
                        </div>
                     </div>
                  </div>
               )}
            </div>
           );
        })}
        {filteredSales.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
             Nenhuma venda registrada nesta modalidade.
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesManager;
