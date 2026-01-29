
import React, { useState, useEffect } from 'react';
import { Sale, Customer, PaymentStatus, Expense, Product } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

  const totalFixedExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalStockValueAtSalesPrice = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

  const getFinancialsForMonth = (month: number, year: number) => {
    return sales.reduce((acc, s) => {
      const saleDate = new Date(s.date);
      if (saleDate.getMonth() === month && saleDate.getFullYear() === year) {
        acc.grossRevenue += s.baseAmount;
        acc.discounts += s.discount;
        acc.cardFees += (s.cardFeeAmount || 0);
        acc.netRevenue += s.netAmount;
        acc.totalCostOfGoods += s.totalCost;
      }
      return acc;
    }, { grossRevenue: 0, discounts: 0, cardFees: 0, netRevenue: 0, totalCostOfGoods: 0 });
  };

  const currentMonthFinancials = getFinancialsForMonth(currentMonth, currentYear);
  const productProfit = currentMonthFinancials.netRevenue - currentMonthFinancials.totalCostOfGoods;
  const monthlyRealProfit = productProfit - totalFixedExpenses;

  const historyData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const financials = getFinancialsForMonth(d.getMonth(), d.getFullYear());
    const profit = (financials.netRevenue - financials.totalCostOfGoods) - totalFixedExpenses;
    return {
      name: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
      Faturamento: financials.netRevenue,
      Lucro: profit,
      fullName: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    };
  });

  const totalReceivable = sales.reduce((acc, s) => {
    const totalInst = s.installments.reduce((sum, i) => sum + i.amount, 0);
    const paidInst = s.installments.reduce((sum, i) => sum + i.paidAmount, 0);
    const unpaidRatio = totalInst > 0 ? (totalInst - paidInst) / totalInst : 0;
    return acc + (s.netAmount * unpaidRatio);
  }, 0);

  const overdueSalesCount = sales.filter(s => 
    s.installments.some(i => i.status !== PaymentStatus.PAID && new Date(i.dueDate) < new Date())
  ).length;

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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Dashboard Financeiro</h2>
          <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">Gestão Inteligente & Moda</p>
        </div>
        <button 
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="bg-indigo-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-indigo-950 transition shadow-xl"
        >
          {showBreakdown ? 'Fechar Detalhamento' : 'DRE Detalhado'}
        </button>
      </div>

      {/* KPI Card de Estoque - Mais translúcido */}
      <div className="bg-indigo-900/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-indigo-400/20 text-white overflow-hidden relative">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Capital em Mercadoria (Venda)</p>
               <h3 className="text-5xl font-black tracking-tighter">{formatCurrency(totalStockValueAtSalesPrice)}</h3>
               <p className="text-[10px] text-indigo-300 mt-2 font-bold uppercase tracking-widest italic opacity-75">Investimento total pronto para retorno</p>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-lg border border-white/20 shadow-inner">
               <p className="text-indigo-100 text-[9px] font-black uppercase tracking-widest mb-1">Total a Receber ("Rua")</p>
               <p className="text-2xl font-black text-white">{formatCurrency(totalReceivable)}</p>
            </div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Grid de Cards com Transparência de Luxo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/40 group hover:bg-white/90 transition-all duration-300">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Entradas Líquidas</p>
          <h3 className="text-2xl font-black text-slate-900">{formatCurrency(currentMonthFinancials.netRevenue)}</h3>
          <p className="text-[9px] text-indigo-600 mt-1 font-black uppercase tracking-tighter">Faturamento real do mês</p>
        </div>

        <div className="bg-white/70 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-white/40 group hover:bg-white/90 transition-all duration-300">
          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-1">Custo Vendido (CMV)</p>
          <h3 className="text-2xl font-black text-rose-600">{formatCurrency(currentMonthFinancials.totalCostOfGoods)}</h3>
          <p className="text-[9px] text-slate-500 mt-1 font-black uppercase tracking-tighter">Investimento nas peças vendidas</p>
        </div>

        <div className={`p-6 rounded-3xl shadow-2xl border-2 backdrop-blur-lg transition-all duration-300 ${monthlyRealProfit >= 0 ? 'bg-emerald-50/80 border-emerald-400/30' : 'bg-rose-50/80 border-rose-400/30'}`}>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-1">Lucro Real Final</p>
          <h3 className={`text-2xl font-black ${monthlyRealProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(monthlyRealProfit)}
          </h3>
          <p className="text-[9px] text-slate-500 mt-1 font-black uppercase tracking-tighter italic">Após abater despesas fixas</p>
        </div>
      </div>

      {showBreakdown && (
        <div className="bg-slate-900/95 backdrop-blur-xl text-white p-10 rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 border border-white/10">
           <h4 className="text-xl font-black uppercase italic tracking-widest mb-8 text-indigo-400 border-b border-white/10 pb-4">Demonstrativo Financeiro (DRE)</h4>
           <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                 <span>(+) FATURAMENTO BRUTO</span>
                 <span className="font-bold">{formatCurrency(currentMonthFinancials.grossRevenue)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-400">
                 <span>(-) DESCONTOS & TAXAS</span>
                 <span>{formatCurrency(currentMonthFinancials.discounts + currentMonthFinancials.cardFees)}</span>
              </div>
              <div className="flex justify-between pt-2 text-indigo-300 font-black">
                 <span>(=) RECEITA LÍQUIDA</span>
                 <span>{formatCurrency(currentMonthFinancials.netRevenue)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-500 mt-6">
                 <span>(-) CUSTO DAS MERCADORIAS (CMV)</span>
                 <span>{formatCurrency(currentMonthFinancials.totalCostOfGoods)}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2 text-rose-500 mt-2">
                 <span>(-) DESPESAS FIXAS DA LOJA</span>
                 <span>{formatCurrency(totalFixedExpenses)}</span>
              </div>
              <div className="flex justify-between pt-6 mt-6 border-t-4 border-indigo-500/30 text-3xl font-black text-emerald-400">
                 <span>LUCRO FINAL</span>
                 <span>{formatCurrency(monthlyRealProfit)}</span>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/50">
          <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em] mb-8">Fluxo Semestral (Faturamento vs Lucro)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" dy={10} stroke="#64748b" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="900" stroke="#64748b" />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.4)'}} 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '16px', fontWeight: '900', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="Faturamento" fill="#4338ca" radius={[8, 8, 0, 0]} barSize={28} />
                <Bar dataKey="Lucro" fill="#059669" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-[2.5rem] shadow-xl border border-white/50">
             <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em] mb-6">Saúde Financeira</h4>
             <div className="space-y-5">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Margem de Lucro</span>
                   <span className="text-sm font-black text-slate-900">
                      {currentMonthFinancials.netRevenue > 0 
                        ? ((monthlyRealProfit / currentMonthFinancials.netRevenue) * 100).toFixed(1) + '%' 
                        : '0%'}
                   </span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-400 uppercase">Índice de Inadimplência</span>
                   <span className={`text-sm font-black ${overdueSalesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                     {overdueSalesCount} Pendência(s)
                   </span>
                </div>
             </div>
          </div>

          <div className={`p-8 rounded-[2.5rem] border-2 flex flex-col transition-all shadow-xl backdrop-blur-lg ${insights.includes('⚠️') ? 'bg-amber-50/90 border-amber-200' : 'bg-indigo-50/90 border-indigo-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h4 className={`font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-2 ${insights.includes('⚠️') ? 'text-amber-900' : 'text-indigo-900'}`}>
                IA Insight Fashion
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
