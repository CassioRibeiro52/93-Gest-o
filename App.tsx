
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Customer, Sale, User, Expense, Product } from './types';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import SalesManager from './components/SalesManager';
import Agenda from './components/Agenda';
import Settings from './components/Settings';
import Landing from './components/Landing';
import Tutorial from './components/Tutorial';
import ExpenseManager from './components/ExpenseManager';
import InventoryManager from './components/InventoryManager';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [showTutorial, setShowTutorial] = useState(false);
  
  const isMounted = useRef(false);

  // URL da nova imagem focada apenas em roupas (araras e cabides modernos)
  const FASHION_IMAGE_URL = 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2000';

  useEffect(() => {
    const initApp = () => {
      try {
        const savedUser = localStorage.getItem('gestao93_current_user');
        if (savedUser && savedUser !== 'undefined') {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && parsedUser.id) {
            setUser(parsedUser);
            const userId = parsedUser.id;
            
            const tutorialSeen = localStorage.getItem(`gestao93_tutorial_seen_${userId}`);
            if (!tutorialSeen) setShowTutorial(true);

            const safeParse = (key: string, fallback: any) => {
              try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : fallback;
              } catch { return fallback; }
            };

            setCustomers(safeParse(`gestao93_customers_${userId}`, []));
            setSales(safeParse(`gestao93_sales_${userId}`, []));
            setExpenses(safeParse(`gestao93_expenses_${userId}`, []));
            setProducts(safeParse(`gestao93_products_${userId}`, []));
          }
        }
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
        localStorage.removeItem('gestao93_current_user');
      } finally {
        setLoading(false);
        isMounted.current = true;
      }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (loading || !user || !isMounted.current) return;

    const timer = setTimeout(() => {
      try {
        setSyncStatus('syncing');
        const userId = user.id;
        localStorage.setItem(`gestao93_customers_${userId}`, JSON.stringify(customers));
        localStorage.setItem(`gestao93_sales_${userId}`, JSON.stringify(sales));
        localStorage.setItem(`gestao93_expenses_${userId}`, JSON.stringify(expenses));
        localStorage.setItem(`gestao93_products_${userId}`, JSON.stringify(products));
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [customers, sales, expenses, products, user, loading]);

  const handleLogout = () => {
    localStorage.removeItem('gestao93_current_user');
    setUser(null);
    setActiveView('dashboard');
  };

  const clearUserData = () => {
    if (!user) return;
    const userId = user.id;
    localStorage.removeItem(`gestao93_customers_${userId}`);
    localStorage.removeItem(`gestao93_sales_${userId}`);
    localStorage.removeItem(`gestao93_expenses_${userId}`);
    localStorage.removeItem(`gestao93_products_${userId}`);
    setCustomers([]);
    setSales([]);
    setExpenses([]);
    setProducts([]);
    alert("Todos os seus dados foram apagados.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-950">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <h1 className="text-white font-black text-2xl italic uppercase tracking-tighter">Gestão 93</h1>
        </div>
      </div>
    );
  }

  if (!user) return <Landing onLogin={setUser} />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard sales={sales} customers={customers} expenses={expenses} products={products} />;
      case 'customers': return <CustomerList customers={customers} sales={sales} onAdd={(c) => setCustomers([...customers, { ...c, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }])} onDelete={(id) => setCustomers(customers.filter(c => c.id !== id))} />;
      case 'sales-cash': return <SalesManager mode="cash" sales={sales} customers={customers} products={products} onAddSale={(s) => setSales([...sales, { ...s, id: Math.random().toString(36).substr(2, 9) }])} onUpdateSale={(s) => setSales(sales.map(sale => sale.id === s.id ? s : sale))} />;
      case 'sales-credit': return <SalesManager mode="credit" sales={sales} customers={customers} products={products} onAddSale={(s) => setSales([...sales, { ...s, id: Math.random().toString(36).substr(2, 9) }])} onUpdateSale={(s) => setSales(sales.map(sale => sale.id === s.id ? s : sale))} />;
      case 'inventory': return <InventoryManager products={products} onAdd={(p) => setProducts([...products, { ...p, id: Math.random().toString(36).substr(2, 9) }])} onDelete={(id) => setProducts(products.filter(p => p.id !== id))} onUpdate={(p) => setProducts(products.map(prod => prod.id === p.id ? p : prod))} />;
      case 'expenses': return <ExpenseManager expenses={expenses} onAdd={(description, amount) => setExpenses([...expenses, { id: Math.random().toString(36).substr(2, 9), description, amount }])} onDelete={(id) => setExpenses(expenses.filter(e => e.id !== id))} />;
      case 'agenda': return <Agenda sales={sales} customers={customers} />;
      case 'settings': return <Settings user={user} customers={customers} sales={sales} products={products} onUpdateProfile={(u) => { setUser(u); localStorage.setItem('gestao93_current_user', JSON.stringify(u)); }} onImport={(data) => { setCustomers(data.customers); setSales(data.sales); setProducts(data.products || []); }} onClear={clearUserData} />;
      default: return <Dashboard sales={sales} customers={customers} expenses={expenses} products={products} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Camada de Fundo Temático Principal - Opacidade em 50% */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${FASHION_IMAGE_URL})`,
          opacity: '0.50',
        }}
      />

      {showTutorial && <Tutorial activeView={activeView} onClose={() => { localStorage.setItem(`gestao93_tutorial_seen_${user.id}`, 'true'); setShowTutorial(false); }} />}
      
      {/* Barra Lateral com Textura de Moda sobre o Roxo - Opacidade em 50% */}
      <nav className="w-full md:w-64 bg-indigo-950 text-white flex flex-col shrink-0 z-50 shadow-2xl relative overflow-hidden">
        {/* Overlay de imagem na barra lateral para visibilidade do tema apenas com roupas */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-50 mix-blend-soft-light bg-cover bg-center"
          style={{ backgroundImage: `url(${FASHION_IMAGE_URL})` }}
        />

        <div className="relative z-10 p-6 flex items-center gap-3 border-b border-indigo-900/50">
          <div className="bg-indigo-600 p-2 rounded-xl shrink-0 shadow-lg border border-white/20">
             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tighter italic uppercase text-white truncate drop-shadow-md">Gestão 93</h1>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-300 drop-shadow-sm">{syncStatus === 'synced' ? 'Salvo' : 'Sincronizando'}</span>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex-1 py-4 space-y-1 px-3 overflow-y-auto no-scrollbar">
          <NavItem id="nav-dashboard" icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" label="Início" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem id="nav-inventory" icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" label="Estoque" active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <NavItem id="nav-customers" icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" label="Clientes" active={activeView === 'customers'} onClick={() => setActiveView('customers')} />
          <div className="pt-4 pb-1 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 drop-shadow-sm">Operacional</div>
          <NavItem id="nav-sales-cash" icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="À Vista" active={activeView === 'sales-cash'} onClick={() => setActiveView('sales-cash')} />
          <NavItem id="nav-sales-credit" icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="A Prazo" active={activeView === 'sales-credit'} onClick={() => setActiveView('sales-credit')} />
          <NavItem id="nav-agenda" icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" label="Agenda" active={activeView === 'agenda'} onClick={() => setActiveView('agenda')} />
          <NavItem id="nav-expenses" icon="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" label="Despesas" active={activeView === 'expenses'} onClick={() => setActiveView('expenses')} />
          <div className="pt-4 pb-1 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 drop-shadow-sm">Configurações</div>
          <NavItem id="nav-settings" icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" label="Ajustes" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>
        
        <div className="relative z-10 p-4 bg-black/30 border-t border-indigo-900/50">
           <div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/10 shadow-inner backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg italic shrink-0 overflow-hidden shadow-lg border border-white/20">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white">{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-shadow-sm">
                <p className="text-[10px] font-black truncate text-white uppercase">{user.name}</p>
                <p className="text-[8px] text-indigo-300 font-bold uppercase tracking-tighter">Boutique Premium</p>
              </div>
              <button onClick={handleLogout} className="text-indigo-200 hover:text-rose-400 transition transform hover:scale-110">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
           </div>
        </div>
      </nav>

      <main className="relative flex-1 p-4 md:p-8 overflow-y-auto h-screen z-10">
        <div className="max-w-6xl mx-auto pb-12 relative">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ id?: string; icon: string; label: string; active: boolean; onClick: () => void; }> = ({ id, icon, label, active, onClick }) => (
  <button id={id} onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group ${active ? 'bg-indigo-600 text-white shadow-xl translate-x-1 border border-white/10' : 'text-indigo-100 hover:bg-white/10 hover:text-white'}`}>
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
    <span className={`text-sm font-bold tracking-tight whitespace-nowrap drop-shadow-sm ${active ? 'font-black' : ''}`}>{label}</span>
    {active && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]"></div>}
  </button>
);

export default App;
