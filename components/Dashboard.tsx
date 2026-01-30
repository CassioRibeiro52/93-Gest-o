
import React, { useState, useEffect } from 'react';
import { Sale, Customer, PaymentStatus, Expense, Product } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  products: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales, customers, expenses, products }) => {
  const [insights, setInsights] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filtragem e Cálculos
  const getFinancialsForMonth = (month: number, year: number) => {
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });

    const monthExpenses = expenses.filter(e => {
      if (!e.date) return true; // Despesas fixas antigas sem data
      const expDate = new Date(e.date);
      return expDate.getMonth() === month && expDate.getFullYear() === year;
    });

    const stats = monthSales.reduce((acc, s) => {
      acc.grossRevenue += s.baseAmount;
      acc.discounts += s.discount;
      acc.cardFees += (s.cardFeeAmount || 0);
      acc.totalCostOfGoods += s.totalCost;
      return acc;
    }, { grossRevenue: 0, discounts: 0, cardFees: 0, totalCostOfGoods: 0 });

    const totalRefunds = monthExpenses
      .filter(e => e.category === 'refund')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalFixedExpenses = monthExpenses
      .filter(e => e.category === 'fixed' || !e.category)
      .reduce((sum, e) => sum + e.amount, 0);

    // Venda Líquida (após descontos e taxas)
    const netRevenueBeforeRefund = monthSales.reduce((sum, s) => sum + s.netAmount, 0);
    
    // VENDA REAL (Cruzamento de Faturamento - Estornos)
    const realRevenue = netRevenueBeforeRefund - totalRefunds;

    // Fluxo de Caixa (O que realmente caiu na conta)
    const realReceived = sales.reduce((total, sale) => {
      return total + sale.installments.reduce((sum, inst) => {
        if (inst.paymentDate) {
          const pDate = new Date(inst.paymentDate);
          if (pDate.getMonth() === month && pDate.getFullYear() === year) {
            return sum + inst.paidAmount;
          }
        }
        return sum;
      }, 0);
    }, 0);

    return { 
      ...stats, 
      realRevenue, 
      realReceived, 
      totalRefunds, 
      totalFixedExpenses,
      profit: realRevenue - stats.totalCostOfGoods - totalFixedExpenses
    };
  };

  const cur = getFinancialsForMonth(currentMonth, currentYear);
  const totalStockValueAtSalesPrice = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const historyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const financials = getFinancialsForMonth(d.getMonth(), d.getFullYear());
    return {
      name: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
      Faturamento: financials.realRevenue,
      Recebido: financials.realReceived,
    };
  });

  const fetchInsights = async (force = false) => {
    if (!force && insights && insights !== 'Carregando insights...') return;
    if (sales.length === 0) {
      setInsights("Registre suas primeiras vendas para ver a análise da IA.");
      return;
    }
    setIsSyncing(true);
    setInsights("Analisando seus dados financeiros...");
    const result = await getFinancialInsights(sales, customers);
    setInsights(result || "Nenhum insight disponível.");
    setIsSyncing(false);
  };

  useEffect(() => {
    if (!insights) fetchInsights();
  }, [sales.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="backdrop-blur-sm bg-white/30 p-2 rounded-xl">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Análise de Venda Real</h2>
          <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">Cruzamento de Faturamento vs Estornos</p>
        </div>
        <button 
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="bg-indigo-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-indigo-950 transition shadow-xl"
        >
          {showBreakdown ? 'Ver DRE Completo' : 'Ver DRE Completo'}
        </button>
      </div>

      {/* KPI Principal: Venda Real */}
      <div className="bg-indigo-900/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-indigo-400/20 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Resultado de Venda Real (Líquida)</p>
               <h3 className="text-5xl font-black tracking-tighter">{formatCurrency(cur.realRevenue)}</h3>
               <p className="text-[10px] text-indigo-300 mt-2 font-bold uppercase tracking-widest italic opacity-75">
                 Já subtraído R$ {cur.totalRefunds.toFixed(2)} em estornos e descontos.
               </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-lg border border-white/20 shadow-inner">
                   <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest mb-1">Capital em Estoque (Venda)</p>
                   <p className="text-2xl font-black text-white">{formatCurrency(totalStockValueAtSalesPrice)}</p>
                </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/40 group">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Estornos no Mês</p>
          <h3 className="text-xl font-black text-rose-600">{formatCurrency(cur.totalRefunds)}</h3>
          <p className="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-tighter">Total devolvido/cancelado</p>
        </div>

        <div className="bg-emerald-600 p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Entrada de Caixa (Real)</p>
          <h3 className="text-xl font-black text-white relative z-10">{formatCurrency(cur.realReceived)}</h3>
          <p className="text-[9px] text-emerald-200 mt-1 font-black uppercase tracking-tighter relative z-10">O que caiu no banco este mês</p>
          <div className="absolute -right-4 -bottom-4 opacity-20 text-white">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/40 group">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Custo das Peças (CMV)</p>
          <h3 className="text-xl font-black text-slate-800">{formatCurrency(cur.totalCostOfGoods)}</h3>
          <p className="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-tighter">Preço de custo dos itens vendidos</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-2xl border-2 backdrop-blur-lg ${cur.profit >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-rose-50 border-rose-200'}`}>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-1">Lucro Operacional</p>
          <h3 className={`text-xl font-black ${cur.profit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
            {formatCurrency(cur.profit)}
          </h3>
          <p className="text-[9px] text-slate-500 mt-1 font-black uppercase tracking-tighter italic">Após estornos e fixas</p>
        </div>
      </div>

      {showBreakdown && (
        <div className="bg-slate-900/95 backdrop-blur-xl text-white p-10 rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 border border-white/10">
           <h4 className="text-xl font-black uppercase italic tracking-widest mb-8 text-indigo-400 border-b border-white/10 pb-4">Demonstrativo de Resultado Líquido (Real)</h4>
           <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                 <span>(+) FATURAMENTO BRUTO</span>
                 <span className="font-bold">{formatCurrency(cur.grossRevenue)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-300">
                 <span>(-) DESCONTOS / TAXAS CARTÃO</span>
                 <span>{formatCurrency(cur.discounts + cur.cardFees)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-500 font-bold">
                 <span>(-) ESTORNOS & DEVOLUÇÕES</span>
                 <span>{formatCurrency(cur.totalRefunds)}</span>
              </div>
              <div className="flex justify-between pt-2 text-indigo-300 font-black text-lg">
                 <span>(=) VENDA REAL LÍQUIDA</span>
                 <span>{formatCurrency(cur.realRevenue)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-500 mt-6">
                 <span>(-) CUSTO DAS MERCADORIAS (CMV)</span>
                 <span>{formatCurrency(cur.totalCostOfGoods)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-500">
                 <span>(-) DESPESAS FIXAS DA LOJA</span>
                 <span>{formatCurrency(cur.totalFixedExpenses)}</span>
              </div>
              <div className="flex justify-between pt-6 mt-6 border-t-4 border-indigo-500/30 text-3xl font-black text-emerald-400">
                 <span>LUCRO FINAL</span>
                 <span>{formatCurrency(cur.profit)}</span>
              </div>
           </div>
        </div>
      )}

      {/* Histórico e IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/50">
          <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em] mb-8">Evolução de Faturamento Real</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" stroke="#64748b" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="900" stroke="#64748b" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.4)'}} 
                  contentStyle={{ borderRadius: '24px', border: 'none', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="Faturamento" fill="#4338ca" radius={[8, 8, 0, 0]} barSize={28} />
                <Bar dataKey="Recebido" fill="#10b981" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col transition-all shadow-xl backdrop-blur-lg ${insights.includes('⚠️') ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className={`font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-2 ${insights.includes('⚠️') ? 'text-amber-900' : 'text-indigo-900'}`}>
                Insights Financeiros (IA)
              </h4>
              <button onClick={() => fetchInsights(true)} disabled={isSyncing} className="text-[9px] font-black uppercase text-indigo-700 underline tracking-tighter">Recalcular</button>
            </div>
            <div className={`text-xs leading-relaxed font-black italic ${insights.includes('⚠️') ? 'text-amber-900' : 'text-indigo-900'}`}>
               "{insights}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
