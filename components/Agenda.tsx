
import React from 'react';
import { Sale, Customer, PaymentStatus, Installment } from '../types';

interface AgendaProps {
  sales: Sale[];
  customers: Customer[];
}

interface GroupedInstallment extends Installment {
  customerName: string;
  saleDescription: string;
  installmentIndex: number;
  totalInstallments: number;
}

const Agenda: React.FC<AgendaProps> = ({ sales, customers }) => {
  // Flatten and group installments by month
  const getAllInstallments = (): GroupedInstallment[] => {
    return sales.flatMap(sale => 
      sale.installments.map((inst, idx) => {
        const isCounterSale = sale.customerId === 'BALCAO';
        const customer = isCounterSale ? { name: '🛒 Venda Balcão' } : customers.find(c => c.id === sale.customerId);
        
        return {
          ...inst,
          customerName: customer?.name || 'Cliente Excluído',
          saleDescription: sale.description,
          installmentIndex: idx + 1,
          totalInstallments: sale.installments.length
        };
      })
    );
  };

  const groupedByMonth = getAllInstallments().reduce((acc, inst) => {
    const date = new Date(inst.dueDate);
    const monthYear = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(inst);
    return acc;
  }, {} as Record<string, GroupedInstallment[]>);

  // Sort months
  const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => {
    const [monthA, yearA] = a.split(' de ');
    const [monthB, yearB] = b.split(' de ');
    const dateA = new Date(parseInt(yearA), new Date(Date.parse(monthA + " 1, 2012")).getMonth());
    const dateB = new Date(parseInt(yearB), new Date(Date.parse(monthB + " 1, 2012")).getMonth());
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Agenda de Recebimentos</h2>
        <div className="flex gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Pago
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pendente
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Atrasado
          </span>
        </div>
      </div>

      {sortedMonthKeys.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 text-slate-400">
          Nenhum lançamento futuro encontrado.
        </div>
      )}

      {sortedMonthKeys.map(month => {
        const monthInstallments = groupedByMonth[month].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        const monthTotal = monthInstallments.reduce((sum, i) => sum + i.amount, 0);
        const monthPaid = monthInstallments.reduce((sum, i) => sum + i.paidAmount, 0);

        return (
          <div key={month} className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
              <h3 className="text-lg font-bold text-indigo-900 capitalize">{month}</h3>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Total do Mês</p>
                <p className="text-sm font-bold text-slate-700">
                  R$ {monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                  <span className="text-xs text-emerald-600 ml-2">(Pago: R$ {monthPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthInstallments.map(inst => {
                const isOverdue = inst.status !== PaymentStatus.PAID && new Date(inst.dueDate) < new Date();
                
                return (
                  <div key={inst.id} className={`bg-white p-4 rounded-2xl shadow-sm border ${isOverdue ? 'border-rose-100 bg-rose-50/20' : 'border-slate-100'} hover:shadow-md transition`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="max-w-[70%]">
                        <p className={`text-xs font-bold truncate ${inst.customerName.includes('🛒') ? 'text-amber-600' : 'text-indigo-600'}`}>{inst.customerName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{inst.saleDescription}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inst.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                        isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inst.status === PaymentStatus.PAID ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end mt-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vencimento</p>
                        <p className="text-xs font-semibold text-slate-700">{new Date(inst.dueDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Parcela {inst.installmentIndex}/{inst.totalInstallments}</p>
                        <p className="text-sm font-bold text-slate-800">R$ {inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                    
                    {inst.status === PaymentStatus.PARTIAL && (
                      <div className="mt-2 pt-2 border-t border-slate-50">
                         <div className="flex justify-between text-[9px] font-bold text-emerald-600 uppercase">
                           <span>Aberto: R$ {(inst.amount - inst.paidAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                           <span>Pago: R$ {inst.paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
    </div>
  );
};

export default Agenda;
