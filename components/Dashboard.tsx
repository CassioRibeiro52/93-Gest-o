
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
  const [showBreakdown, setShowBreakdown] = useState(true);
  
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

  const forecastData = useMemo(() => {
    const data = [];
    const baseDate = new Date();
    baseDate.setDate(1);

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

  const financials = useMemo(() => {
    const monthSales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate.getMonth() === selectedMonth && saleDate.getFullYear() === selectedYear;
    });

    const monthExpenses = expenses.filter(e => {
      if (!e.date) return true; 
      const expDate = new Date(e.date);
      return expDate.getMonth() === selectedMonth && expDate.getFullYear() === selectedYear;
    });

    // 1. FATURAMENTO BRUTO: Tudo que foi vendido no mês
    const faturamentoBruto = monthSales.reduce((acc, s) => acc + s.totalAmount, 0);

    // 2. CUSTO DAS MERCADORIAS (CMV)
    const totalCostOfGoods = monthSales.reduce((acc, s) => acc + s.totalCost, 0);

    // 3. LUCRO BRUTO: Diferença entre preço de venda e preço de custo
    const lucroBruto = faturamentoBruto - totalCostOfGoods;

    // 4. DESPESAS
    const totalRefunds = monthExpenses
      .filter(e => e.category === 'refund')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalFixedExpenses = monthExpenses
      .filter(e => e.category === 'fixed' || !e.category)
      .reduce((sum, e) => sum + e.amount, 0);

    // 5. LUCRO LÍQUIDO: Lucro Bruto - Despesas
    const lucroLiquido = lucroBruto - totalFixedExpenses - totalRefunds;

    // Métricas de Fluxo de Caixa (O que realmente entrou)
    const realReceived = sales.reduce((total, sale) => {
      return total + sale.installments.reduce((sum, inst) => {
        if (inst.paymentDate) {
          const pDate = new Date(inst.paymentDate);
          if (pDate.getMonth() === selectedMonth && pDate.getFullYear() === selectedYear) {
            return sum + inst.paidAmount;
          }
        }
        return sum;
      }, 0);
    }, 0);

    return { 
      faturamentoBruto, 
      totalCostOfGoods, 
      lucroBruto, 
      totalRefunds, 
      totalFixedExpenses, 
      lucroLiquido,
      realReceived
    };
  }, [sales, expenses, selectedMonth, selectedYear]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="backdrop-blur-sm bg-white/30 p-2 rounded-xl">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Dashboard Estratégico</h2>
          <p className="text-sm text-slate-700 font-bold uppercase tracking-wider">Gestão Financeira Profissional</p>
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

      <div className="bg-indigo-950 p-8 rounded-[3rem] shadow-2xl border border-indigo-400/20 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Lucro Líquido ({months[selectedMonth]})</p>
               <h3 className={`text-5xl font-black tracking-tighter ${financials.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                 {formatCurrency(financials.lucroLiquido)}
               </h3>
               <p className="text-indigo-400 text-[9px] font-bold uppercase mt-2">Saldo Real após descontar custos e despesas</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <div className="bg-white/5 p-5 rounded-3xl backdrop-blur-lg border border-white/10 shadow-inner flex-1 md:flex-none">
                   <p className="text-indigo-200 text-[9px] font-black uppercase tracking-widest mb-1">Faturamento Bruto</p>
                   <p className="text-2xl font-black text-white">{formatCurrency(financials.faturamentoBruto)}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl backdrop-blur-lg shadow-inner flex-1 md:flex-none">
                   <p className="text-emerald-300 text-[9px] font-black uppercase tracking-widest mb-1">Entrada em Caixa</p>
                   <p className="text-2xl font-black text-emerald-400">{formatCurrency(financials.realReceived)}</p>
                </div>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">A Receber (Geral)</p>
          <h3 className="text-xl font-black text-amber-500">{formatCurrency(totalAbertura)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Lucro Bruto (Peças)</p>
          <h3 className="text-xl font-black text-emerald-600">{formatCurrency(financials.lucroBruto)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Despesas Fixas</p>
          <h3 className="text-xl font-black text-rose-600">{formatCurrency(financials.totalFixedExpenses)}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Capital em Estoque</p>
          <h3 className="text-xl font-black text-indigo-600">{formatCurrency(totalStockValueAtSalesPrice)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 min-w-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.3em]">Fluxo de Caixa Futuro (6 Meses)</h4>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase">A Receber</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Já Recebido</span>
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
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
            <h4 className="font-black text-[9px] uppercase tracking-[0.3em] text-indigo-400 mb-6">Análise Inteligente</h4>
            <p className="text-xs leading-relaxed font-medium italic opacity-90">"{insights}"</p>
            <button onClick={() => fetchInsights(true)} disabled={isSyncing} className="mt-6 text-[9px] font-black uppercase text-indigo-400 underline decoration-indigo-400/30 hover:text-white transition">Recalcular Insights</button>
          </div>

          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <h4 className="font-black text-indigo-900 text-[10px] uppercase tracking-widest mb-3">Demonstrativo de Resultado</h4>
            <button 
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full bg-white text-indigo-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-200 shadow-sm"
            >
              {showBreakdown ? 'Ocultar DRE' : 'Ver DRE Completo'}
            </button>
          </div>
        </div>
      </div>

      {showBreakdown && (
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 border border-slate-100">
           <h4 className="text-xl font-black uppercase italic tracking-widest mb-8 text-slate-900 border-b border-slate-100 pb-4">DRE - Demonstrativo de Resultado</h4>
           <div className="space-y-4 text-sm font-medium">
              <div className="flex justify-between text-indigo-900 font-black uppercase text-sm p-4 bg-indigo-50 rounded-2xl">
                 <span>FATURAMENTO BRUTO (Total Vendido)</span>
                 <span>{formatCurrency(financials.faturamentoBruto)}</span>
              </div>
              
              <div className="flex justify-between text-rose-500 px-4 py-2">
                 <span className="font-bold uppercase text-xs">(-) Custo das Mercadorias (CMV)</span>
                 <span className="font-black">{formatCurrency(financials.totalCostOfGoods)}</span>
              </div>

              <div className="h-px bg-slate-100 mx-4"></div>
              
              <div className="flex justify-between text-emerald-600 font-black uppercase text-sm p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                 <span>(=) LUCRO BRUTO</span>
                 <span>{formatCurrency(financials.lucroBruto)}</span>
              </div>
              
              <div className="flex justify-between text-rose-500 px-4 py-2">
                 <span className="font-bold uppercase text-xs">(-) Despesas Fixas / Operacionais</span>
                 <span className="font-black">{formatCurrency(financials.totalFixedExpenses)}</span>
              </div>

              <div className="flex justify-between text-rose-500 px-4 py-2">
                 <span className="font-bold uppercase text-xs">(-) Estornos / Devoluções</span>
                 <span className="font-black">{formatCurrency(financials.totalRefunds)}</span>
              </div>

              <div className="flex justify-between pt-6 mt-6 border-t-4 border-indigo-500/10 text-4xl font-black text-indigo-600 p-4">
                 <div className="flex flex-col">
                   <span>LUCRO LÍQUIDO</span>
                   <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Resultado Final do Mês</span>
                 </div>
                 <span className={financials.lucroLiquido >= 0 ? 'text-indigo-600' : 'text-rose-600'}>
                   {formatCurrency(financials.lucroLiquido)}
                 </span>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest pt-4 italic">
                * Faturamento Bruto: Valor total das vendas realizadas no período.
                <br/>* Lucro Bruto: Ganho direto sobre a venda (Venda - Custo).
                <br/>* Lucro Líquido: O que sobra após pagar todas as despesas e estornos.
              </p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
