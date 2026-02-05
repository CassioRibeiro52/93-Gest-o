
import React, { useState } from 'react';
import { Sale, Customer, PaymentStatus, Installment, SaleItem } from '../types.ts';

interface AgendaProps {
  sales: Sale[];
  customers: Customer[];
  onUpdateSale: (sale: Sale) => void;
}

interface ConsolidatedCard {
  id: string; // ID único para controle de estado (customerId + dueDate)
  customerId: string;
  customerName: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isOverdue: boolean;
  salesIds: string[];
  descriptions: string[];
  items: SaleItem[]; // Lista consolidada de itens vendidos
}

const Agenda: React.FC<AgendaProps> = ({ sales, customers, onUpdateSale }) => {
  const [abatimentoValues, setAbatimentoValues] = useState<Record<string, string>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

  const getGroupedData = () => {
    const months: Record<string, ConsolidatedCard[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    sales.forEach(sale => {
      sale.installments.forEach(inst => {
        const date = new Date(inst.dueDate);
        const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        const customerId = sale.customerId;
        const remaining = inst.amount - inst.paidAmount;

        if (!months[monthYear]) months[monthYear] = [];
        
        const cardId = `${customerId}-${inst.dueDate}`;
        let card = months[monthYear].find(c => c.id === cardId);

        if (!card) {
          const customer = customerId === 'BALCAO' 
            ? { name: 'Venda Balcão' } 
            : customers.find(c => c.id === customerId);

          card = {
            id: cardId,
            customerId,
            customerName: (customer?.name || 'Cliente Excluído').toUpperCase(),
            dueDate: inst.dueDate,
            totalAmount: 0,
            paidAmount: 0,
            remainingAmount: 0,
            isOverdue: false,
            salesIds: [],
            descriptions: [],
            items: []
          };
          months[monthYear].push(card);
        }

        card.totalAmount += inst.amount;
        card.paidAmount += inst.paidAmount;
        card.remainingAmount += remaining;
        
        if (remaining > 0 && new Date(inst.dueDate) < today) {
          card.isOverdue = true;
        }
        
        if (!card.salesIds.includes(sale.id)) {
          card.salesIds.push(sale.id);
          // Adiciona os itens da venda à lista consolidada do card
          if (sale.items && sale.items.length > 0) {
            card.items = [...card.items, ...sale.items];
          }
        }

        const shortDesc = sale.description.split(':')[1]?.trim() || sale.description.split(',')[0].substring(0, 15);
        const descUpper = shortDesc.toUpperCase();
        if (!card.descriptions.includes(descUpper)) {
          card.descriptions.push(descUpper);
        }
      });
    });

    Object.keys(months).forEach(m => {
      months[m].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    });

    return months;
  };

  const handlePaymentAction = (card: ConsolidatedCard, amountStr: string) => {
    let amountToPay = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amountToPay) || amountToPay <= 0) return;

    const todayStr = new Date().toISOString().split('T')[0];
    
    card.salesIds.forEach(saleId => {
      const sale = sales.find(s => s.id === saleId);
      if (!sale) return;

      const updatedInstallments = sale.installments.map(inst => {
        if (inst.dueDate === card.dueDate && amountToPay > 0) {
          const debt = inst.amount - inst.paidAmount;
          const payment = Math.min(debt, amountToPay);
          const newPaidAmount = inst.paidAmount + payment;
          amountToPay -= payment;
          
          return {
            ...inst,
            paidAmount: newPaidAmount,
            paymentDate: newPaidAmount >= inst.amount ? todayStr : inst.paymentDate,
            status: newPaidAmount >= inst.amount ? PaymentStatus.PAID : PaymentStatus.PARTIAL
          };
        }
        return inst;
      });

      const allPaid = updatedInstallments.every(i => i.paidAmount >= i.amount);
      onUpdateSale({
        ...sale,
        installments: updatedInstallments,
        status: allPaid ? PaymentStatus.PAID : PaymentStatus.PARTIAL
      });
    });

    setAbatimentoValues(prev => ({ ...prev, [card.id]: '' }));
  };

  const groupedData = getGroupedData();
  const sortedMonthKeys = Object.keys(groupedData).sort((a, b) => {
    const parseMonth = (str: string) => {
      const parts = str.split(' de ');
      const monthsMap = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      return new Date(parseInt(parts[1]), monthsMap.indexOf(parts[0].toLowerCase())).getTime();
    };
    return parseMonth(a) - parseMonth(b);
  });

  const toggleExpand = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Agenda Consolidada</h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Acompanhamento direto de recebimentos por data</p>
      </div>

      {sortedMonthKeys.map(month => {
        const cards = groupedData[month];
        
        return (
          <div key={month} className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <span className="text-[11px] font-black text-indigo-600 bg-white px-4 py-1.5 rounded-full border-2 border-indigo-100 uppercase tracking-tighter shadow-sm">{month}</span>
              <div className="h-0.5 flex-1 bg-slate-200/50"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cards.map((card) => {
                const isPaid = card.remainingAmount <= 0;
                const isExpanded = expandedCardId === card.id;
                const dueDate = new Date(card.dueDate + 'T12:00:00');
                const inputKey = card.id;
                
                const statusColor = isPaid ? 'emerald' : (card.isOverdue ? 'rose' : 'amber');
                const statusBg = isPaid ? 'bg-emerald-500' : (card.isOverdue ? 'bg-rose-500' : 'bg-amber-400');

                return (
                  <div 
                    key={card.id} 
                    className={`flex flex-col bg-white border-2 rounded-[2rem] transition-all shadow-sm relative overflow-hidden h-fit ${isPaid ? 'opacity-60 border-slate-100' : `border-${statusColor}-100 hover:shadow-xl ${isExpanded ? 'ring-4 ring-indigo-50' : ''}`} ${isExpanded ? 'col-span-2' : ''}`}
                  >
                    {/* Cabeçalho do Card */}
                    <div 
                      onClick={() => toggleExpand(card.id)}
                      className="p-5 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`flex items-center justify-center text-[10px] font-black w-10 h-10 rounded-full text-white shadow-md shrink-0 ${statusBg}`}>
                          {dueDate.getDate()}/{dueDate.getMonth() + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-black text-slate-900 truncate tracking-tight leading-tight uppercase">
                            {card.customerName}
                          </h4>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
                        </div>
                        <div className="text-slate-300">
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>

                      <div className="flex-1 mb-2 space-y-1">
                        <h5 className="text-[9px] font-black text-slate-400 uppercase leading-none tracking-tight">
                          {card.descriptions.length > 1 ? 'MÚLTIPLOS LANÇAMENTOS' : card.descriptions[0]}
                        </h5>
                        <p className={`text-xl font-black tracking-tighter leading-none ${isPaid ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {formatCurrency(card.remainingAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Conteúdo Expandido: Detalhes dos Produtos */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-2 duration-300">
                        <h6 className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-3 italic">Conteúdo desta Dívida:</h6>
                        <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar mb-4">
                          {card.items.length > 0 ? card.items.map((item, i) => (
                            <div key={i} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                              <div className="min-w-0 flex-1 pr-2">
                                <p className="text-[9px] font-black text-slate-800 uppercase truncate">{item.description}</p>
                                <p className="text-[8px] text-slate-400 font-bold uppercase">{item.quantity} UN x {formatCurrency(item.price)}</p>
                              </div>
                              <span className="text-[9px] font-black text-indigo-600 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          )) : (
                            <p className="text-[9px] text-slate-400 italic">Detalhes não disponíveis para esta venda antiga.</p>
                          )}
                        </div>

                        {/* Botões de Ação dentro do Detalhe */}
                        {!isPaid && (
                          <div className="space-y-2">
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden h-10 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                              <input 
                                type="text" 
                                inputMode="decimal"
                                placeholder="Abater R$"
                                value={abatimentoValues[inputKey] || ''}
                                onChange={e => setAbatimentoValues(prev => ({ ...prev, [inputKey]: e.target.value }))}
                                className="w-full h-full px-3 text-[11px] font-black text-indigo-600 outline-none placeholder:text-slate-300"
                              />
                              <button 
                                onClick={() => handlePaymentAction(card, abatimentoValues[inputKey] || '0')}
                                className="bg-indigo-600 text-white px-4 h-full hover:bg-indigo-700 transition-all flex items-center justify-center"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M12 4v16m8-8H4" /></svg>
                              </button>
                            </div>
                            <button 
                              onClick={() => handlePaymentAction(card, card.remainingAmount.toString())}
                              className="w-full bg-emerald-500 text-white h-10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-lg shadow-emerald-50"
                            >
                              Liquidar Parcela
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Visual simples se não estiver pago e não estiver expandido */}
                    {!isPaid && !isExpanded && (
                      <div className="px-5 pb-4 mt-auto">
                        <button 
                          onClick={() => toggleExpand(card.id)}
                          className="w-full py-2 rounded-xl text-[8px] font-black uppercase text-indigo-500 bg-indigo-50 hover:bg-indigo-100 transition"
                        >
                          Ver Detalhes / Abater
                        </button>
                      </div>
                    )}

                    {isPaid && !isExpanded && (
                      <div className="px-5 pb-4 mt-auto">
                        <div className="flex items-center justify-center py-2 gap-2 text-emerald-500 font-black text-[8px] uppercase bg-emerald-50 rounded-xl border border-emerald-100">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          <span>Recebido</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {Object.keys(groupedData).length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-slate-300 gap-4">
          <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p className="font-black uppercase text-xs tracking-[0.3em]">Nenhum recebimento agendado</p>
        </div>
      )}
    </div>
  );
};

export default Agenda;
