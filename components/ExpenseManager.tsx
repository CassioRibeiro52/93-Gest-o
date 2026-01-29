
import React, { useState } from 'react';
import { Expense } from '../types';

interface ExpenseManagerProps {
  expenses: Expense[];
  onAdd: (description: string, amount: number) => void;
  onDelete: (id: string) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onAdd, onDelete }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) return;
    onAdd(description, amount);
    setDescription('');
    setAmount(0);
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Despesas Fixas Mensais</h2>
          <p className="text-sm text-slate-500">Cadastre seus custos fixos para calcular o lucro líquido real.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-700 transition shadow-sm"
        >
          {showAdd ? 'Cancelar' : 'Nova Despesa'}
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Custo Fixo Total do Mês</p>
          <p className="text-3xl font-black text-rose-600">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="p-3 bg-white rounded-2xl text-rose-600 border border-rose-200">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição do Gasto *</label>
              <input 
                type="text" 
                value={description} 
                required
                onChange={e => setDescription(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
                placeholder="Ex: Aluguel da Loja, Internet, MEI..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Mensal (R$) *</label>
              <input 
                type="number" 
                step="0.01"
                value={amount || ''} 
                required
                onChange={e => setAmount(Number(e.target.value))} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-black"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-rose-600 text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-rose-700 transition shadow-lg shadow-rose-100">
              Salvar Despesa Fixa
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expenses.map(expense => (
          <div key={expense.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-rose-200 transition">
             <div>
                <h4 className="font-bold text-slate-800">{expense.description}</h4>
                <p className="text-lg font-black text-rose-600">R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
             <button 
                onClick={() => {
                  if (window.confirm('Excluir esta despesa fixa?')) onDelete(expense.id);
                }}
                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
             >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
             </button>
          </div>
        ))}
        {expenses.length === 0 && !showAdd && (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400">
            Nenhuma despesa fixa cadastrada. Adicione seus custos mensais para ter uma visão real do seu lucro.
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManager;
