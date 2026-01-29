
import React, { useState } from 'react';
import { Customer, Sale, PaymentStatus } from '../types';

interface CustomerListProps {
  customers: Customer[];
  sales: Sale[];
  onAdd: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

const CustomerList: React.FC<CustomerListProps> = ({ customers, sales, onAdd, onDelete }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');

  const getCustomerStats = (customerId: string) => {
    const customerSales = sales.filter(s => s.customerId === customerId);
    let totalPurchased = 0;
    let totalPaid = 0;

    customerSales.forEach(sale => {
      totalPurchased += sale.totalAmount;
      sale.installments.forEach(inst => {
        totalPaid += inst.paidAmount;
      });
    });

    return {
      totalPurchased,
      totalPaid,
      debt: totalPurchased - totalPaid
    };
  };

  const globalStats = customers.reduce((acc, customer) => {
    const stats = getCustomerStats(customer.id);
    acc.totalDebt += stats.debt;
    acc.totalPurchased += stats.totalPurchased;
    return acc;
  }, { totalDebt: 0, totalPurchased: 0 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    onAdd({ name, phone, email, cpf, address });
    setName('');
    setPhone('');
    setEmail('');
    setCpf('');
    setAddress('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gerenciamento de Clientes</h2>
          <p className="text-sm text-slate-500">Acompanhe o saldo devedor individual e total.</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition shadow-sm"
        >
          {showAdd ? 'Cancelar' : 'Novo Cliente'}
        </button>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dívida Total Acumulada</p>
          <p className="text-2xl font-bold text-rose-600">
            R$ {globalStats.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total em Vendas (Histórico)</p>
          <p className="text-2xl font-bold text-indigo-600">
            R$ {globalStats.totalPurchased.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome *</label>
              <input 
                type="text" 
                value={name} 
                required
                onChange={e => setName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Maria Silva"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone *</label>
              <input 
                type="text" 
                value={phone} 
                required
                onChange={e => setPhone(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF (Opcional)</label>
              <input 
                type="text" 
                value={cpf} 
                onChange={e => setCpf(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="000.000.000-00"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço (Opcional)</label>
              <input 
                type="text" 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rua, Número, Bairro, Cidade"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail (Opcional)</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="maria@email.com"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
              Salvar Cliente
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Informações do Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Comprado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Pago</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Dívida Atual</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(customer => {
                const stats = getCustomerStats(customer.id);
                return (
                  <tr key={customer.id} className="hover:bg-slate-50 transition group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{customer.name}</div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">{customer.phone}</span>
                           {customer.cpf && <span className="text-[10px] text-slate-400 font-mono">CPF: {customer.cpf}</span>}
                        </div>
                        {customer.address && (
                          <div className="text-[10px] text-slate-400 italic mt-0.5">
                            <span className="font-bold uppercase not-italic">End:</span> {customer.address}
                          </div>
                        )}
                        {customer.email && <div className="text-[10px] text-indigo-400 underline">{customer.email}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-600">R$ {stats.totalPurchased.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-600">
                      <span className="text-sm font-medium">R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${stats.debt > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        R$ {stats.debt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onDelete(customer.id)}
                        className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                        title="Excluir Cliente"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Nenhum cliente cadastrado.
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

export default CustomerList;
