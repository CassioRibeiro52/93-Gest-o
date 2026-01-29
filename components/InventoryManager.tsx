
import React, { useState } from 'react';
import { Product, Sale } from '../types';

interface InventoryManagerProps {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, onAdd, onDelete, onUpdate }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(2);

  const totalCostValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const expectedProfit = totalSaleValue - totalCostValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price < 0 || stock < 0) return;
    const finalSku = sku.trim().toUpperCase() || Math.random().toString(36).substr(2, 6).toUpperCase();
    if (products.some(p => p.sku.toUpperCase() === finalSku)) {
      alert(`Código "${finalSku}" já existe.`);
      return;
    }
    onAdd({ sku: finalSku, name, category: category || 'Geral', costPrice, price, stock, minStock });
    resetForm();
    setShowAdd(false);
  };

  const resetForm = () => { setSku(''); setName(''); setCategory(''); setCostPrice(0); setPrice(0); setStock(0); setMinStock(2); };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Estoque & Produtos</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Gerencie suas peças e preços de custo.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="bg-indigo-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-950 transition shadow-lg"
          >
            {showAdd ? 'Cancelar' : 'Novo Produto'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Custo Total em Estoque</p>
           <p className="text-xl font-black text-slate-900">{formatCurrency(totalCostValue)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total de Venda</p>
           <p className="text-xl font-black text-indigo-800">{formatCurrency(totalSaleValue)}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
           <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Lucro Bruto Projetado</p>
           <p className="text-xl font-black text-emerald-800">{formatCurrency(expectedProfit)}</p>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-200 space-y-4 animate-in fade-in zoom-in duration-200">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Código (SKU)</label>
                <input type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900" />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Nome da Peça *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Preço Custo (R$)</label>
                <input type="number" step="0.01" value={costPrice || ''} onChange={e => setCostPrice(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-rose-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Preço Venda (R$)</label>
                <input type="number" step="0.01" value={price || ''} onChange={e => setPrice(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-emerald-700" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Quantidade</label>
                <input type="number" value={stock || ''} onChange={e => setStock(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900" />
              </div>
           </div>
           <div className="flex justify-end pt-2">
              <button type="submit" className="bg-indigo-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-950 transition shadow-lg">Cadastrar Peça</button>
           </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest">Produto</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-right">Custo</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-right">Venda</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-center">Estoque</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-6 py-4">
                    <div className="inline-block bg-slate-200 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded mb-1 uppercase tracking-tighter">{p.sku}</div>
                    <div className="font-black text-slate-900 text-sm uppercase">{p.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-rose-700">{formatCurrency(p.costPrice)}</td>
                  <td className="px-6 py-4 text-right text-sm font-black text-slate-900">{formatCurrency(p.price)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${p.stock <= p.minStock ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => { if (confirm('Excluir peça?')) onDelete(p.id); }} className="p-2 text-slate-400 hover:text-rose-600 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                    Nenhum produto em estoque. Comece cadastrando suas peças.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryManager;
