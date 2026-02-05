
import React, { useState, useEffect, useMemo } from 'react';
import { Customer, Sale, PaymentStatus, Installment, Product, SaleItem } from '../types';

interface SalesManagerProps {
  sales: Sale[];
  customers: Customer[];
  products: Product[];
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onUpdateSale: (sale: Sale) => void;
  onDeleteSale?: (id: string, isRefund: boolean) => void;
  mode: 'cash' | 'credit';
}

const SalesManager: React.FC<SalesManagerProps> = ({ sales, customers, products, onAddSale, onUpdateSale, onDeleteSale, mode }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [isBalcao, setIsBalcao] = useState(false);
  
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  
  const [manualDesc, setManualDesc] = useState('');
  const [manualPrice, setManualPrice] = useState<number>(0);
  const [manualCost, setManualCost] = useState<number>(0);
  const [manualQty, setManualQty] = useState<number>(1);
  const [showManualFields, setShowManualFields] = useState(false);
  
  const [discount, setDiscount] = useState<number>(0);
  const [cardFeeRate, setCardFeeRate] = useState<number>(0);
  
  const [numInstallments, setNumInstallments] = useState<number>(1);
  
  const getNextMonthDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  };
  const [firstDueDate, setFirstDueDate] = useState<string>(getNextMonthDate());
  
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [existingSaleSearch, setExistingSaleSearch] = useState('');

  const [editingInstId, setEditingInstId] = useState<string | null>(null);
  const [editInstValues, setEditInstValues] = useState<{dueDate: string, amount: number, paidAmount: number}>({
    dueDate: '',
    amount: 0,
    paidAmount: 0
  });

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const term = productSearch.toLowerCase();
    return products.filter(p => 
      p.sku.toLowerCase().includes(term) || 
      p.name.toLowerCase().includes(term)
    ).slice(0, 5); 
  }, [productSearch, products]);

  const filteredExistingSaleProducts = useMemo(() => {
    if (!existingSaleSearch.trim()) return [];
    const term = existingSaleSearch.toLowerCase();
    return products.filter(p => 
      p.sku.toLowerCase().includes(term) || 
      p.name.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [existingSaleSearch, products]);

  const baseAmount = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const totalCost = useMemo(() => cart.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0), [cart]);
  const totalAmount = Math.max(0, baseAmount - discount);
  const cardFeeAmount = (totalAmount * cardFeeRate) / 100;
  const netAmount = totalAmount - cardFeeAmount;

  const installmentPreview = useMemo(() => {
    if (numInstallments <= 0) return 0;
    return totalAmount / numInstallments;
  }, [totalAmount, numInstallments]);

  const addToCartFromProduct = (p: Product) => {
    const newItem: SaleItem = {
      id: Math.random().toString(36).substr(2, 5),
      productId: p.id,
      description: `${p.sku} - ${p.name}`,
      price: p.price,
      costPrice: p.costPrice,
      quantity: 1
    };
    setCart([...cart, newItem]);
    setProductSearch('');
  };

  const addManualItemToCart = () => {
    if (!manualDesc || manualPrice <= 0) {
      alert("Informe a descrição e o preço de venda.");
      return;
    }
    const newItem: SaleItem = {
      id: Math.random().toString(36).substr(2, 5),
      description: manualDesc.toUpperCase(),
      price: manualPrice,
      costPrice: manualCost,
      quantity: manualQty
    };
    setCart([...cart, newItem]);
    setManualDesc('');
    setManualPrice(0);
    setManualCost(0);
    setManualQty(1);
    setShowManualFields(false);
  };

  const updateCartItem = (id: string, updates: Partial<SaleItem>) => {
    setCart(cart.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(i => i.id !== id));

  const formatLocalDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCustomerId = isBalcao ? 'BALCAO' : customerId;
    
    if (!finalCustomerId || cart.length === 0 || totalAmount <= 0) {
      alert("Adicione itens ao carrinho e selecione um cliente.");
      return;
    }

    const installments: Installment[] = [];
    const todayStr = formatLocalDate(new Date());

    if (mode === 'cash') {
      installments.push({
        id: Math.random().toString(36).substr(2, 9),
        saleId: '', 
        amount: totalAmount,
        paidAmount: totalAmount,
        dueDate: todayStr,
        paymentDate: todayStr,
        status: PaymentStatus.PAID
      });
    } else {
      const baseValue = Math.floor((totalAmount / numInstallments) * 100) / 100;
      const lastValue = Number((totalAmount - (baseValue * (numInstallments - 1))).toFixed(2));

      const [year, month, day] = firstDueDate.split('-').map(Number);
      
      for (let i = 0; i < numInstallments; i++) {
        let targetMonth = (month - 1) + i;
        let targetYear = year;
        
        while (targetMonth > 11) {
          targetMonth -= 12;
          targetYear += 1;
        }

        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
        const actualDay = Math.min(day, lastDayOfMonth);
        const installmentDate = new Date(targetYear, targetMonth, actualDay);

        installments.push({
          id: Math.random().toString(36).substr(2, 9),
          saleId: '', 
          amount: i === numInstallments - 1 ? lastValue : baseValue,
          paidAmount: 0,
          dueDate: formatLocalDate(installmentDate),
          status: PaymentStatus.PENDING
        });
      }
    }

    onAddSale({
      customerId: finalCustomerId,
      items: cart,
      description: cart.map(i => i.description).join(', ').substring(0, 100),
      baseAmount,
      discount,
      totalAmount,
      cardFeeRate,
      cardFeeAmount,
      netAmount,
      totalCost,
      date: todayStr,
      installments,
      status: mode === 'cash' ? PaymentStatus.PAID : PaymentStatus.PENDING,
      type: mode
    });

    setShowAdd(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId(''); setIsBalcao(false); setCart([]);
    setDiscount(0); setCardFeeRate(0); setNumInstallments(1);
    setFirstDueDate(getNextMonthDate());
    setProductSearch('');
  };

  const handleUpdateInstallment = (sale: Sale, installmentId: string, updates: Partial<Installment>) => {
    const updatedInstallments = sale.installments.map(inst => {
      if (inst.id === installmentId) {
        const newPaidAmount = updates.paidAmount !== undefined ? updates.paidAmount : inst.paidAmount;
        const newAmount = updates.amount !== undefined ? updates.amount : inst.amount;
        
        let newStatus = PaymentStatus.PENDING;
        if (newPaidAmount >= newAmount) newStatus = PaymentStatus.PAID;
        else if (newPaidAmount > 0) newStatus = PaymentStatus.PARTIAL;

        return { ...inst, ...updates, status: newStatus };
      }
      return inst;
    });

    const newTotalAmount = updatedInstallments.reduce((acc, curr) => acc + curr.amount, 0);
    const allPaid = updatedInstallments.every(i => i.paidAmount >= i.amount);
    
    onUpdateSale({
      ...sale,
      totalAmount: newTotalAmount,
      installments: updatedInstallments,
      status: allPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL
    });

    setEditingInstId(null);
  };

  const startEditingInstallment = (inst: Installment) => {
    setEditingInstId(inst.id);
    setEditInstValues({
      dueDate: inst.dueDate,
      amount: inst.amount,
      paidAmount: inst.paidAmount
    });
  };

  const handleAddItemToExistingSale = (sale: Sale, p: Product) => {
    const newItem: SaleItem = {
      id: Math.random().toString(36).substr(2, 5),
      productId: p.id,
      description: `${p.sku} - ${p.name}`,
      price: p.price,
      costPrice: p.costPrice,
      quantity: 1
    };
    
    const updatedItems = [...sale.items, newItem];
    const newBaseAmount = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newTotalCost = updatedItems.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0);
    const newTotalAmount = Math.max(0, newBaseAmount - sale.discount);
    
    // ATUALIZAÇÃO DAS PARCELAS: Adiciona o valor do novo item à próxima parcela pendente
    const updatedInstallments = [...sale.installments];
    const nextPendingIdx = updatedInstallments.findIndex(inst => inst.status !== PaymentStatus.PAID);
    
    if (nextPendingIdx !== -1) {
      updatedInstallments[nextPendingIdx] = {
        ...updatedInstallments[nextPendingIdx],
        amount: updatedInstallments[nextPendingIdx].amount + p.price,
        status: updatedInstallments[nextPendingIdx].paidAmount >= (updatedInstallments[nextPendingIdx].amount + p.price) 
          ? PaymentStatus.PAID : PaymentStatus.PARTIAL
      };
    } else {
      // Se todas as parcelas já foram pagas, cria uma nova parcela de cobrança para hoje
      const todayStr = formatLocalDate(new Date());
      updatedInstallments.push({
        id: Math.random().toString(36).substr(2, 9),
        saleId: sale.id,
        amount: p.price,
        paidAmount: 0,
        dueDate: todayStr,
        status: PaymentStatus.PENDING
      });
    }

    onUpdateSale({
      ...sale,
      items: updatedItems,
      baseAmount: newBaseAmount,
      totalAmount: newTotalAmount,
      totalCost: newTotalCost,
      description: updatedItems.map(i => i.description).join(', ').substring(0, 100),
      installments: updatedInstallments,
      status: PaymentStatus.PARTIAL
    });
    setExistingSaleSearch('');
  };

  const accentColor = mode === 'cash' ? 'emerald' : 'indigo';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">
            {mode === 'cash' ? 'Vendas À Vista' : 'Vendas A Prazo'}
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">
            {mode === 'cash' ? 'Venda rápida e busca por código' : 'Gestão de fluxo e escolha de vencimentos'}
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className={`bg-${accentColor}-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-${accentColor}-700 transition shadow-lg active:scale-95`}
        >
          {showAdd ? 'Cancelar' : 'Nova Venda'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddSale} className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Cliente</label>
                  <button type="button" onClick={() => setIsBalcao(!isBalcao)} className={`text-[10px] font-black px-3 py-1 rounded-full transition ${isBalcao ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {isBalcao ? '✓ Balcão' : 'Venda Balcão?'}
                  </button>
                </div>
                {!isBalcao && (
                  <select value={customerId} onChange={e => setCustomerId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Selecionar Cliente...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase">Carrinho / Itens da Venda</label>
                    <button type="button" onClick={() => setShowManualFields(!showManualFields)} className="text-[9px] font-black text-indigo-600 uppercase underline">
                        {showManualFields ? 'Cancelar Item Manual' : '+ Adicionar Item Sem Cadastro'}
                    </button>
                </div>

                {showManualFields ? (
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="text-[8px] font-black text-indigo-400 uppercase">Descrição do Produto</label>
                                <input type="text" value={manualDesc} onChange={e => setManualDesc(e.target.value)} className="w-full bg-white border-none p-2 text-[10px] font-black rounded outline-none" placeholder="Ex: Vestido Festa Avulso" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[8px] font-black text-indigo-400 uppercase">Venda R$</label>
                                    <input type="number" step="0.01" value={manualPrice || ''} onChange={e => setManualPrice(Number(e.target.value))} className="w-full bg-white border-none p-2 text-[10px] font-black text-emerald-600 rounded outline-none" />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-indigo-400 uppercase">Custo R$</label>
                                    <input type="number" step="0.01" value={manualCost || ''} onChange={e => setManualCost(Number(e.target.value))} className="w-full bg-white border-none p-2 text-[10px] font-black text-rose-500 rounded outline-none" />
                                </div>
                                <div>
                                    <label className="text-[8px] font-black text-indigo-400 uppercase">Qtd</label>
                                    <input type="number" value={manualQty} onChange={e => setManualQty(Number(e.target.value))} className="w-full bg-white border-none p-2 text-[10px] font-black rounded outline-none" />
                                </div>
                            </div>
                            <button type="button" onClick={addManualItemToCart} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Adicionar à Venda</button>
                        </div>
                    </div>
                ) : (
                    <div className="relative mb-4">
                      <input 
                        type="text" 
                        placeholder="Pesquisar por Código (SKU) ou Nome..." 
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                      />
                      {filteredProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-50">
                          {filteredProducts.map(p => (
                            <button key={p.id} type="button" onClick={() => addToCartFromProduct(p)} className="w-full p-3 text-left hover:bg-indigo-50 transition flex justify-between items-center group">
                              <div className="min-w-0">
                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mr-2 uppercase">{p.sku}</span>
                                <span className="text-[10px] font-bold text-slate-800 uppercase">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600">R$ {p.price.toFixed(2)} +</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex flex-col bg-white p-3 rounded-xl border border-slate-200 group shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-800 uppercase truncate flex-1">{item.description}</p>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Preço</label>
                          <input type="number" value={item.price} onChange={e => updateCartItem(item.id, { price: Number(e.target.value) })} className="w-full bg-slate-50 border-none p-1 text-[10px] font-black text-indigo-600 rounded" />
                        </div>
                        <div className="w-20">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Qtd</label>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateCartItem(item.id, { quantity: Number(e.target.value) })} className="w-full bg-slate-50 border-none p-1 text-[10px] font-black text-slate-900 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && !showManualFields && (
                      <p className="text-[10px] text-slate-400 text-center py-4 italic">Carrinho vazio. Busque um produto ou use o lançamento manual.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total da Nota</p>
                <h3 className="text-4xl font-black tracking-tighter">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-300">Desconto (R$)</label>
                    <input type="number" step="0.01" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-black text-white focus:bg-white/20 outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-300">Taxa Cartão (%)</label>
                    <input type="number" step="0.1" value={cardFeeRate || ''} onChange={e => setCardFeeRate(Number(e.target.value))} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm font-black text-white focus:bg-white/20 outline-none" />
                  </div>
                </div>
              </div>

              {mode === 'credit' && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Qtd Parcelas</label>
                      <input type="number" min="1" max="24" value={numInstallments} onChange={e => setNumInstallments(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Vencimento da 1ª Parcela</label>
                      <input 
                        type="date" 
                        value={firstDueDate} 
                        onChange={e => setFirstDueDate(e.target.value)} 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" 
                      />
                    </div>
                  </div>
                  <div className="bg-indigo-100 p-3 rounded-xl border border-indigo-200 text-center">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Preview de Cobrança</p>
                    <p className="text-lg font-black text-indigo-900">{numInstallments}x de R$ {installmentPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className={`w-full md:w-auto px-12 py-4 rounded-2xl bg-${accentColor}-600 text-white text-xs font-black uppercase tracking-widest shadow-xl hover:bg-${accentColor}-700 transition active:scale-95`}>
              Finalizar {mode === 'cash' ? 'Venda À Vista' : 'Venda A Prazo'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {sales.filter(s => s.type === mode).map(sale => {
          const isExpanded = selectedSaleId === sale.id;
          const totalPaid = sale.installments.reduce((acc, inst) => acc + inst.paidAmount, 0);
          const remaining = sale.totalAmount - totalPaid;

          return (
            <div key={sale.id} className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 ${isExpanded ? 'border-indigo-400 ring-4 ring-indigo-50 scale-[1.01]' : 'border-slate-100 hover:border-slate-200'}`}>
              <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${sale.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{customers.find(c => c.id === sale.customerId)?.name || '🛒 Cliente Balcão'}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-xs">{sale.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${sale.status === PaymentStatus.PAID ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-white'}`}>
                        {sale.status === PaymentStatus.PAID ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 ml-auto">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-black text-slate-900 leading-none">R$ {sale.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <button onClick={() => setSelectedSaleId(isExpanded ? null : sale.id)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition">
                    <svg className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-50 animate-in slide-in-from-top-2 duration-300 space-y-6">
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Incrementar esta venda</h4>
                    <div className="relative">
                      <input type="text" placeholder="Pesquisar Produto..." value={existingSaleSearch} onChange={e => setExistingSaleSearch(e.target.value)} className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none shadow-sm" />
                      {filteredExistingSaleProducts.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden divide-y divide-slate-50">
                          {filteredExistingSaleProducts.map(p => (
                            <button key={p.id} type="button" onClick={() => handleAddItemToExistingSale(sale, p)} className="w-full p-3 text-left hover:bg-indigo-50 transition flex justify-between items-center group">
                              <div className="min-w-0">
                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded mr-2 uppercase">{p.sku}</span>
                                <span className="text-[10px] font-bold text-slate-800 uppercase">{p.name}</span>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600">Adicionar +</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Parcelas</h4>
                       <p className="text-[10px] font-black text-rose-600 uppercase">Aberto: R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase">
                          <tr>
                            <th className="px-4 py-3">Parc.</th>
                            <th className="px-4 py-3">Vencimento</th>
                            <th className="px-4 py-3">Valor</th>
                            <th className="px-4 py-3">Pago</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sale.installments.map((inst, idx) => {
                            const isEditing = editingInstId === inst.id;
                            return (
                              <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                                <td className="px-4 py-3 font-black text-slate-400">{idx + 1}ª</td>
                                <td className="px-4 py-3 font-bold text-slate-700">
                                  {isEditing ? (
                                    <input 
                                      type="date" 
                                      value={editInstValues.dueDate} 
                                      onChange={e => setEditInstValues({...editInstValues, dueDate: e.target.value})}
                                      className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-bold text-[10px]"
                                    />
                                  ) : (
                                    new Date(inst.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')
                                  )}
                                </td>
                                <td className="px-4 py-3 font-black text-slate-900">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400">R$</span>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={editInstValues.amount} 
                                        onChange={e => setEditInstValues({...editInstValues, amount: Number(e.target.value)})}
                                        className="w-16 bg-white border border-slate-200 rounded px-2 py-1 outline-none font-black text-[10px]"
                                      />
                                    </div>
                                  ) : (
                                    `R$ ${inst.amount.toFixed(2)}`
                                  )}
                                </td>
                                <td className="px-4 py-3 font-black text-emerald-600">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400">R$</span>
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        value={editInstValues.paidAmount} 
                                        onChange={e => setEditInstValues({...editInstValues, paidAmount: Number(e.target.value)})}
                                        className="w-16 bg-white border border-slate-200 rounded px-2 py-1 outline-none font-black text-[10px]"
                                      />
                                    </div>
                                  ) : (
                                    `R$ ${inst.paidAmount.toFixed(2)}`
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    {isEditing ? (
                                      <>
                                        <button 
                                          onClick={() => handleUpdateInstallment(sale, inst.id, editInstValues)}
                                          className="bg-emerald-500 text-white p-1 rounded hover:bg-emerald-600 transition"
                                          title="Salvar"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </button>
                                        <button 
                                          onClick={() => setEditingInstId(null)}
                                          className="bg-slate-400 text-white p-1 rounded hover:bg-slate-500 transition"
                                          title="Cancelar"
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button 
                                          onClick={() => startEditingInstallment(inst)}
                                          className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                          title="Editar Parcela"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        {inst.paidAmount < inst.amount && (
                                          <button 
                                            onClick={() => handleUpdateInstallment(sale, inst.id, { paidAmount: inst.amount, paymentDate: formatLocalDate(new Date()) })} 
                                            className="bg-emerald-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase hover:bg-emerald-600 transition"
                                          >
                                            Quitar
                                          </button>
                                        )}
                                        {inst.paidAmount >= inst.amount && <span className="text-emerald-500 font-black">✓</span>}
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button onClick={() => onDeleteSale && onDeleteSale(sale.id, false)} className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition">Excluir Venda</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SalesManager;
