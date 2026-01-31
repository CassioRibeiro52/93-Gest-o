
import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';

interface InventoryManagerProps {
  products: Product[];
  onAdd: (product: Omit<Product, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (product: Product) => void;
}

type EditableField = 'costPrice' | 'price' | 'stock';

interface EditingState {
  id: string;
  field: EditableField;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, onAdd, onDelete, onUpdate }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  
  // Estados do formulário de novo produto
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(2);

  // Efeito para auto-preencher ao digitar SKU existente
  useEffect(() => {
    const normalizedSku = sku.trim().toUpperCase();
    if (normalizedSku) {
      const existing = products.find(p => p.sku.toUpperCase() === normalizedSku);
      if (existing) {
        // Preenche apenas se o campo estiver vazio ou se for uma mudança de SKU
        setName(existing.name);
        setPrice(existing.price);
        setCategory(existing.category);
      }
    }
  }, [sku, products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return products;
    return products.filter(p => 
      p.sku.toLowerCase().includes(term) || 
      p.name.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  const totalCostValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const expectedProfit = totalSaleValue - totalCostValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price < 0 || stock < 0) return;
    const finalSku = sku.trim().toUpperCase() || Math.random().toString(36).substr(2, 6).toUpperCase();
    
    onAdd({ sku: finalSku, name, category: category || 'Geral', costPrice, price, stock, minStock });
    resetForm();
    setShowAdd(false);
  };

  const startEditing = (id: string, field: EditableField, value: number) => {
    setEditing({ id, field });
    setTempValue(value.toString());
  };

  const handleUpdate = (p: Product) => {
    if (!editing) return;
    const val = parseFloat(tempValue.replace(',', '.'));
    if (!isNaN(val)) {
      onUpdate({ ...p, [editing.field]: val });
    }
    setEditing(null);
  };

  const resetForm = () => { 
    setSku(''); setName(''); setCategory(''); setCostPrice(0); setPrice(0); setStock(0); setMinStock(2); 
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const existingProduct = useMemo(() => {
    return products.find(p => p.sku.toUpperCase() === sku.trim().toUpperCase());
  }, [sku, products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">Estoque & Produtos</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-none">Gestão de custos e lucratividade real da loja.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-900 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-950 transition shadow-lg"
        >
          {showAdd ? 'Cancelar' : 'Entrada de Peças'}
        </button>
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-xl border border-indigo-100 space-y-4 animate-in fade-in zoom-in duration-200">
           {existingProduct && (
             <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl mb-4">
               <p className="text-[10px] font-black text-amber-800 uppercase leading-tight">
                 ⚠️ ITEM RECONHECIDO: {existingProduct.name}
               </p>
               <p className="text-[9px] font-bold text-amber-700 uppercase mt-1 leading-tight">
                 O sistema preencheu os campos automaticamente. Ao salvar, será feito o cálculo do **Custo Médio**.
               </p>
             </div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Código (SKU)</label>
                <input 
                  type="text" 
                  value={sku} 
                  onChange={e => setSku(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Ex: COD123" 
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Nome da Peça *</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="Nome do Produto" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Preço Custo (R$) *</label>
                <input type="number" step="0.01" value={costPrice || ''} onChange={e => setCostPrice(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-rose-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Preço Venda (R$) *</label>
                <input type="number" step="0.01" value={price || ''} onChange={e => setPrice(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-emerald-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Quantidade Entrada *</label>
                <input type="number" value={stock || ''} onChange={e => setStock(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Estoque Mínimo</label>
                <input type="number" value={minStock} onChange={e => setMinStock(Number(e.target.value))} required className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
           </div>
           <div className="flex justify-end pt-2">
              <button type="submit" className="bg-indigo-900 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95">
                {existingProduct ? 'Atualizar Estoque & Média' : 'Salvar Novo Produto'}
              </button>
           </div>
        </form>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Procurar no estoque..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
              />
              <svg className="w-4 h-4 absolute right-4 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <div className="hidden md:block text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
              DICA: CLIQUE EM QUALQUER VALOR PARA EDITAR MANUALMENTE
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest">Peça</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-right">Custo</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-right">Venda</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-center">Estoque</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-800 uppercase tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-indigo-50/30 transition group">
                  <td className="px-6 py-4">
                    <div className="inline-block bg-slate-200 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded mb-1 uppercase tracking-tighter">{p.sku}</div>
                    <div className="font-black text-slate-900 text-sm uppercase leading-tight">{p.name}</div>
                  </td>
                  
                  {/* Coluna Custo */}
                  <td className="px-6 py-4 text-right">
                    {editing?.id === p.id && editing?.field === 'costPrice' ? (
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={tempValue} 
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleUpdate(p)}
                        onKeyDown={e => { if(e.key === 'Enter') handleUpdate(p); if(e.key === 'Escape') setEditing(null); }}
                        autoFocus
                        className="w-20 bg-white border-2 border-indigo-400 rounded px-2 py-1 text-right text-xs font-black outline-none"
                      />
                    ) : (
                      <button 
                        onClick={() => startEditing(p.id, 'costPrice', p.costPrice)}
                        className="text-xs font-bold text-rose-700 border-b border-rose-100 border-dashed hover:border-rose-400 transition-colors"
                      >
                        {formatCurrency(p.costPrice)}
                      </button>
                    )}
                  </td>

                  {/* Coluna Venda */}
                  <td className="px-6 py-4 text-right">
                    {editing?.id === p.id && editing?.field === 'price' ? (
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={tempValue} 
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleUpdate(p)}
                        onKeyDown={e => { if(e.key === 'Enter') handleUpdate(p); if(e.key === 'Escape') setEditing(null); }}
                        autoFocus
                        className="w-20 bg-white border-2 border-indigo-400 rounded px-2 py-1 text-right text-xs font-black outline-none"
                      />
                    ) : (
                      <button 
                        onClick={() => startEditing(p.id, 'price', p.price)}
                        className="text-sm font-black text-slate-900 border-b border-slate-100 border-dashed hover:border-indigo-400 transition-colors"
                      >
                        {formatCurrency(p.price)}
                      </button>
                    )}
                  </td>

                  {/* Coluna Estoque */}
                  <td className="px-6 py-4 text-center">
                    {editing?.id === p.id && editing?.field === 'stock' ? (
                      <input 
                        type="number" 
                        value={tempValue} 
                        onChange={e => setTempValue(e.target.value)}
                        onBlur={() => handleUpdate(p)}
                        onKeyDown={e => { if(e.key === 'Enter') handleUpdate(p); if(e.key === 'Escape') setEditing(null); }}
                        autoFocus
                        className="w-16 bg-white border-2 border-indigo-400 rounded px-2 py-1 text-center text-xs font-black outline-none"
                      />
                    ) : (
                      <button 
                        onClick={() => startEditing(p.id, 'stock', p.stock)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all hover:ring-2 hover:ring-indigo-300 ${p.stock <= p.minStock ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}
                      >
                        {p.stock}
                        {p.stock <= p.minStock && <span className="ml-2 text-[8px] animate-pulse">!</span>}
                      </button>
                    )}
                  </td>

                  {/* Coluna Ações (Excluir) */}
                  <td className="px-6 py-4 text-center">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm('Excluir este produto do estoque permanentemente?')) {
                          onDelete(p.id);
                        }
                      }} 
                      className="p-2 text-slate-300 hover:text-rose-600 transition-colors rounded-lg hover:bg-rose-50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest italic">
                    {searchTerm ? `Sem resultados para "${searchTerm}"` : 'O estoque está vazio.'}
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
