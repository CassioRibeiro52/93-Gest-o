
import React, { useState, useEffect, useMemo } from 'react';
import { Sale, Customer, PaymentStatus, Expense, Product } from '../types';
import { getFinancialInsights } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2024;
    const list = [];
    for (let y = currentYear + 1; y >= startYear; y--) list.push(y);
    return list;
  }, []);

  // Cálculo de Previsão de Recebimentos (Próximos 6 meses corrigido)
  const forecastData = useMemo(() => {
    const data = [];
    const baseDate = new Date();
    baseDate.setDate(1); // Define dia 1 para evitar pulo de meses curtos (ex: Fev)

    for (let i = 0; i < 6; i++) {
      const d = new Date(baseDate);
      d.setMonth(baseDate.getMonth() + i);
      const m = d.getMonth();
      const y = d.getFullYear();

      let pending = 0;
      let received = 0;

      sales.forEach(sale => {
        sale.installments.forEach(inst => {
          const dueDate = new Date(inst.dueDate);
          if (dueDate.getMonth() === m && dueDate.getFullYear() === y) {
            pending += (inst.amount - inst.paidAmount);
            received += inst.paidAmount;
          }
        });
      });

      data.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
        Pendente: pending,
        Recebido: received,
        monthName: d.toLocaleString('pt-BR', { month: 'long' }),
        year: y
      });
    }
    return data;
  }, [sales]);

  const totalAbertura = useMemo(() => {
    return sales.reduce((acc, sale) => {
      return acc + sale.installments.reduce((sum, inst) => sum + (inst.amount - inst.paidAmount), 0);
    }, 0);
  }, [sales]);

  const getFinancialsForMonth = (month: number, year: number) => {
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate.getMonth() === month && saleDate.getFullYear() === year;
    });

    const monthExpenses = expenses.filter(e => {
      if (!e.date) return true; 
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

    const netRevenueBeforeRefund = monthSales.reduce((sum, s) => sum + s.netAmount, 0);
    const realRevenue = netRevenueBeforeRefund - totalRefunds;

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

  const cur = getFinancialsForMonth(selectedMonth, selectedYear);
  const totalStockValueAtSalesPrice = products.reduce((acc, p) => acc + (p.price * p.stock), 0);

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
    <div className="space-y-6 pb-20">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="backdrop-blur-sm bg-white/30 p-2 rounded-xl">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Dashboard Estratégico</h2>
          <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">Gestão de Vendas & Previsões</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/80 p-1.5 rounded-2xl shadow-sm border border-slate-200">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-xs font-black uppercase text-indigo-900 px-3 py-1.5 outline-none cursor-pointer"
          >
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-xs font-black uppercase text-indigo-900 px-3 py-1.5 outline-none cursor-pointer border-l border-slate-200"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Principal */}
      <div className="bg-indigo-950 p-8 rounded-[3rem] shadow-2xl border border-indigo-400/20 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Faturamento Bruto ({months[selectedMonth]})</p>
               <h3 className="text-5xl font-black tracking-tighter">{formatCurrency(cur.grossRevenue)}</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="bg-white/5 p-5 rounded-3xl backdrop-blur-lg border border-white/10 shadow-inner flex-1 md:flex-none">
                   <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Total a Receber (Geral)</p>
                   <p className="text-2xl font-black text-amber-400">{formatCurrency(totalAbertura)}</p>
                </div>
                <div className="bg-white/5 p-5 rounded-3xl backdrop-blur-lg border border-white/10 shadow-inner flex-1 md:flex-none">
                   <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Líquido Estimado</p>
                   <p className="text-2xl font-black text-emerald-400">{formatCurrency(cur.realRevenue)}</p>
                </div>
            </div>
          </div>
      </div>

      {/* Cards Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Recebido no Mês</p>
          <h3 className="text-xl font-black text-emerald-600">{formatCurrency(cur.realReceived)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Custo Mercadorias</p>
          <h3 className="text-xl font-black text-slate-800">{formatCurrency(cur.totalCostOfGoods)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Capital em Estoque</p>
          <h3 className="text-xl font-black text-indigo-600">{formatCurrency(totalStockValueAtSalesPrice)}</h3>
        </div>
        <div className={`p-6 rounded-3xl shadow-sm border ${cur.profit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mb-1">Lucro Operacional</p>
          <h3 className={`text-xl font-black ${cur.profit >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>{formatCurrency(cur.profit)}</h3>
        </div>
      </div>

      {/* SEÇÃO: PREVISÃO DE RECEBIMENTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 min-w-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em]">Previsão de Recebimentos (6 Meses)</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Estimativa de fluxo de caixa futuro</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Pendente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Recebido</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 min-h-[256px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="900" stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="900" stroke="#94a3b8" />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}} 
                  contentStyle={{ borderRadius: '20px', border: 'none', background: '#0f172a', color: '#fff' }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                />
                <Bar dataKey="Pendente" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} barSize={35} />
                <Bar dataKey="Recebido" stackId="a" fill="#10b981" radius={[8, 8, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase">
                <tr>
                  <th className="px-4 py-3">Mês / Período</th>
                  <th className="px-4 py-3 text-right">A Receber</th>
                  <th className="px-4 py-3 text-right">Já Recebido</th>
                  <th className="px-4 py-3 text-right">Total Esperado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forecastData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-black text-slate-700 uppercase">{item.monthName} {item.year}</td>
                    <td className="px-4 py-3 text-right font-black text-indigo-600">{formatCurrency(item.Pendente)}</td>
                    <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(item.Recebido)}</td>
                    <td className="px-4 py-3 text-right font-black text-slate-900">{formatCurrency(item.Pendente + item.Recebido)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <h4 className="font-black text-[9px] uppercase tracking-[0.3em] text-indigo-400 mb-6">Análise Inteligente</h4>
            <p className="text-xs leading-relaxed font-medium italic opacity-90">"{insights}"</p>
            <button onClick={() => fetchInsights(true)} disabled={isSyncing} className="mt-6 text-[9px] font-black uppercase text-indigo-400 underline decoration-indigo-400/30 hover:text-white transition">Recalcular Insights</button>
          </div>

          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <h4 className="font-black text-indigo-900 text-[10px] uppercase tracking-widest mb-3">DRE Simplificado</h4>
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full bg-white text-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200 shadow-sm"
            >
              {showBreakdown ? 'Ocultar Detalhes' : 'Ver DRE Completo'}
            </button>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 border border-slate-100">
           <h4 className="text-xl font-black uppercase italic tracking-widest mb-8 text-slate-900 border-b border-slate-100 pb-4">Demonstrativo Detalhado ({months[selectedMonth]} {selectedYear})</h4>
           <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between text-indigo-600 font-black uppercase text-xs">
                 <span>(+) Faturamento Bruto</span>
                 <span>{formatCurrency(cur.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                 <span>(-) Descontos</span>
                 <span>{formatCurrency(cur.discounts)}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                 <span>(-) Taxas de Cartão</span>
                 <span>{formatCurrency(cur.cardFees)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold border-b border-slate-100 pb-2">
                 <span>(-) Estornos</span>
                 <span>{formatCurrency(cur.totalRefunds)}</span>
              </div>
              <div className="flex justify-between pt-2 text-slate-900 font-black">
                 <span>(=) Faturamento Líquido Real</span>
                 <span>{formatCurrency(cur.realRevenue)}</span>
              </div>
              <div className="flex justify-between text-rose-500 pt-4">
                 <span>(-) Custo de Mercadorias (CMV)</span>
                 <span>{formatCurrency(cur.totalCostOfGoods)}</span>
              </div>
              <div className="flex justify-between text-rose-500">
                 <span>(-) Despesas Fixas</span>
                 <span>{formatCurrency(cur.totalFixedExpenses)}</span>
              </div>
              <div className="flex justify-between pt-6 mt-6 border-t-2 border-indigo-500/10 text-3xl font-black text-indigo-600">
                 <span>LUCRO LÍQUIDO</span>
                 <span>{formatCurrency(cur.profit)}</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
