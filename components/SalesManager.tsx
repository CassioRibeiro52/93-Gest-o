
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
  
  // Carrinho de Itens
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPrice, setManualPrice] = useState<number>(0);

  const [discount, setDiscount] = useState<number>(0);
  const [cardFeeRate, setCardFeeRate] = useState<number>(0);
  
  const [numInstallments, setNumInstallments] = useState<number>(1);
  const [dueDay, setDueDay] = useState<number>(new Date().getDate());
  
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  // Estados para adicionar item a venda existente
  const [editingSaleAddProduct, setEditingSaleAddProduct] = useState('');

  // Cálculos Automáticos do Formulário
  const baseAmount = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const totalCost = useMemo(() => cart.reduce((acc, item) => acc + (item.costPrice * item.quantity), 0), [cart]);
  const totalAmount = Math.max(0, baseAmount - discount);
  const cardFeeAmount = (totalAmount * cardFeeRate) / 100;
  const netAmount = totalAmount - cardFeeAmount;

  // Preview de Parcelas
  const installmentPreview = useMemo(() => {
    if (numInstallments <= 0) return 0;
    return totalAmount / numInstallments;
  }, [totalAmount, numInstallments]);

  const addToCart = () => {
    if (selectedProductId) {
      const p = products.find(prod => prod.id === selectedProductId);
      if (p) {
        const newItem: SaleItem = {
          id: Math.random().toString(36).substr(2, 5),
          productId: p.id,
          description: `${p.sku} - ${p.name}`,
          price: p.price,
          costPrice: p.costPrice,
          quantity: 1
        };
        setCart([...cart, newItem]);
        setSelectedProductId('');
      }
    } else if (manualDescription) {
      const newItem: SaleItem = {
        id: Math.random().toString(36).substr(2, 5),
        description: manualDescription,
        price: manualPrice || 0,
        costPrice: 0,
        quantity: 1
      };
      setCart([...cart, newItem]);
      setManualDescription('');
      setManualPrice(0);
    }
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
    const today = new Date();
    const todayStr = formatLocalDate(today);

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

      for (let i = 1; i <= numInstallments; i++) {
        const dueDate = calculateDueDateFromComponents(today.getFullYear(), today.getMonth(), dueDay, i);
        installments.push({
          id: Math.random().toString(36).substr(2, 9),
          saleId: '', 
          amount: i === numInstallments ? lastValue : baseValue,
          paidAmount: 0,
          dueDate: formatLocalDate(dueDate),
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
    setDueDay(new Date().getDate());
  };

  const calculateDueDateFromComponents = (year: number, month: number, targetDay: number, monthsToAdd: number) => {
    let targetMonth = month + monthsToAdd;
    let targetYear = year;
    while (targetMonth > 11) { targetMonth -= 12; targetYear += 1; }
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const actualDay = Math.min(targetDay, lastDayOfMonth);
    return new Date(targetYear, targetMonth, actualDay);
  };

  const handleAddItemToExistingSale = (sale: Sale, prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;

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
    const newCardFeeAmount = (newTotalAmount * (sale.cardFeeRate || 0)) / 100;
    const newNetAmount = newTotalAmount - newCardFeeAmount;

    onUpdateSale({
      ...sale,
      items: updatedItems,
      baseAmount: newBaseAmount,
      totalAmount: newTotalAmount,
      totalCost: newTotalCost,
      cardFeeAmount: newCardFeeAmount,
      netAmount: newNetAmount,
      description: updatedItems.map(i => i.description).join(', ').substring(0, 100),
      status: PaymentStatus.PARTIAL
    });

    setEditingSaleAddProduct('');
    alert('Item adicionado à venda. Não esqueça de ajustar as parcelas se necessário.');
  };

  const handleUpdateInstallment = (sale: Sale, installmentId: string, updates: Partial<Installment>) => {
    const updatedInstallments = sale.installments.map(inst => inst.id === installmentId ? { ...inst, ...updates } : inst);
    const allPaid = updatedInstallments.every(i => i.paidAmount >= i.amount);
    onUpdateSale({
      ...sale,
      installments: updatedInstallments,
      status: allPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL
    });
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
            {mode === 'cash' ? 'Venda rápida e avulsa' : 'Gestão de fluxo de parcelamento'}
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
            {/* Esquerda: Cliente e Itens */}
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
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-3">Carrinho / Itens Avulsos</label>
                
                {/* Lançamento Avulso (O pedido do usuário) */}
                <div className="flex gap-2 mb-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                  <input 
                    type="text" 
                    placeholder="Item Avulso (ex: Cinto)" 
                    value={manualDescription} 
                    onChange={e => setManualDescription(e.target.value)} 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <input 
                    type="number" 
                    placeholder="Preço R$" 
                    value={manualPrice || ''} 
                    onChange={e => setManualPrice(Number(e.target.value))} 
                    className="w-20 bg-slate-50 border border-slate-100 rounded-lg px-2 py-2 text-[10px] font-black focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                  <button type="button" onClick={addToCart} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-black transition">+</button>
                </div>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center text-[8px] uppercase"><span className="bg-slate-50 px-2 text-slate-400 font-black">Ou Estoque</span></div>
                </div>

                <select value={selectedProductId} onChange={e => { setSelectedProductId(e.target.value); }} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none mb-4">
                  <option value="">Buscar no Catálogo...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (R$ {p.price.toFixed(2)})</option>)}
                </select>
                
                {/* Lista do Carrinho com Edição Direta */}
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
                          <label className="text-[8px] font-black text-slate-400 uppercase">Preço Unitário</label>
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black text-slate-400">R$</span>
                            <input 
                              type="number" 
                              value={item.price} 
                              onChange={e => updateCartItem(item.id, { price: Number(e.target.value) })}
                              className="w-full bg-slate-50 border-none p-1 text-[10px] font-black text-indigo-600 rounded focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="w-20">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Qtd</label>
                          <input 
                            type="number" 
                            min="1"
                            value={item.quantity} 
                            onChange={e => updateCartItem(item.id, { quantity: Number(e.target.value) })}
                            className="w-full bg-slate-50 border-none p-1 text-[10px] font-black text-slate-900 rounded focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && <p className="text-center py-4 text-[10px] font-bold text-slate-400 uppercase italic">Carrinho Vazio</p>}
                </div>
              </div>
            </div>

            {/* Direita: Pagamento */}
            <div className="space-y-4">
              <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total da Nota</p>
                <h3 className="text-4xl font-black tracking-tighter">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="text-[9px] font-black uppercase text-indigo-300">Desconto Geral (R$)</label>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Qtd Parcelas</label>
                      <input type="number" min="1" max="24" value={numInstallments} onChange={e => setNumInstallments(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Dia Vencimento</label>
                      <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  </div>
                  
                  <div className="bg-indigo-100 p-3 rounded-xl border border-indigo-200 text-center">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Parcelamento Recalculado</p>
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

      {/* Lista de Vendas */}
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
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{sale.description}</p>
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
                  {/* Adicionar novos produtos na mesma venda */}
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Incrementar esta venda</h4>
                    <div className="flex gap-2">
                      <select value={editingSaleAddProduct} onChange={e => setEditingSaleAddProduct(e.target.value)} className="flex-1 bg-white border border-indigo-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none">
                        <option value="">Produto do Estoque...</option>
                        {products.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (R$ {p.price.toFixed(2)})</option>)}
                      </select>
                      <button 
                        onClick={() => handleAddItemToExistingSale(sale, editingSaleAddProduct)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-200 active:scale-95 transition"
                      >
                        Incluir
                      </button>
                    </div>
                  </div>

                  {/* Detalhes do Pagamento / Parcelas */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Detalhamento Financeiro</h4>
                       <p className="text-[10px] font-black text-rose-600 uppercase">Aberto: R$ {remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-50/50 text-slate-400 font-black uppercase">
                          <tr>
                            <th className="px-4 py-3">Parc.</th>
                            <th className="px-4 py-3">Vencimento</th>
                            <th className="px-4 py-3">Valor</th>
                            <th className="px-4 py-3">Valor Pago</th>
                            <th className="px-4 py-3">Data Pgto</th>
                            <th className="px-4 py-3 text-center">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sale.installments.map((inst, idx) => (
                            <tr key={inst.id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3 font-black text-slate-400">{idx + 1}ª</td>
                              <td className="px-4 py-3 font-bold text-slate-700">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</td>
                              <td className="px-4 py-3">
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  value={inst.amount} 
                                  onChange={e => handleUpdateInstallment(sale, inst.id, { amount: Number(e.target.value) })}
                                  className="w-16 bg-transparent border-none p-0 font-black text-slate-900 focus:ring-0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  value={inst.paidAmount} 
                                  onChange={e => handleUpdateInstallment(sale, inst.id, { paidAmount: Number(e.target.value) })}
                                  className={`w-16 bg-transparent border-none p-0 font-black focus:ring-0 ${inst.paidAmount >= inst.amount ? 'text-emerald-600' : 'text-amber-600'}`}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input 
                                  type="date" 
                                  value={inst.paymentDate || ''} 
                                  onChange={e => handleUpdateInstallment(sale, inst.id, { paymentDate: e.target.value })}
                                  className="bg-transparent border-none p-0 text-[9px] font-bold text-slate-400 focus:ring-0"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                {inst.paidAmount < inst.amount ? (
                                  <button onClick={() => handleUpdateInstallment(sale, inst.id, { paidAmount: inst.amount, paymentDate: formatLocalDate(new Date()) })} className="bg-emerald-500 text-white px-2 py-1 rounded text-[8px] font-black uppercase shadow-md shadow-emerald-100">Quitar</button>
                                ) : (
                                  <span className="text-emerald-500">✓</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <button onClick={() => onDeleteSale && onDeleteSale(sale.id, false)} className="w-full py-3 bg-rose-50 text-rose-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-600 hover:text-white transition">Excluir Registro de Venda</button>
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
