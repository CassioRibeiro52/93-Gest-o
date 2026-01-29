
import React, { useState } from 'react';
import { Customer, Sale, User, Product } from '../types';

interface SettingsProps {
  user?: User | null;
  customers: Customer[];
  sales: Sale[];
  products: Product[];
  onUpdateProfile?: (user: User) => void;
  onImport: (data: { customers: Customer[], sales: Sale[], products?: Product[] }) => void;
  onClear: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, customers, sales, products, onUpdateProfile, onImport, onClear }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'backup' | 'credits' | 'danger'>('profile');
  
  const [shopName, setShopName] = useState(user?.name || '');
  const [shopLogo, setShopLogo] = useState(user?.avatarUrl || '');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user && onUpdateProfile) {
      onUpdateProfile({ ...user, name: shopName, avatarUrl: shopLogo });
      alert('Perfil da loja atualizado com sucesso!');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    const data = { customers, sales, products, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestao93_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.customers && json.sales) {
          if (confirm('Isso substituirá seus dados atuais. Continuar?')) {
            onImport({ customers: json.customers, sales: json.sales, products: json.products || [] });
          }
        }
      } catch { alert('Erro no arquivo.'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile', label: 'Perfil da Loja' },
          { id: 'backup', label: 'Segurança & Backup' },
          { id: 'credits', label: 'Créditos' },
          { id: 'danger', label: 'Zerar Sistema' }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id as any)} 
            className={`px-6 py-3 text-sm font-black uppercase tracking-wider transition-colors whitespace-nowrap ${activeTab === tab.id ? 'text-indigo-800 border-b-2 border-indigo-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
        {activeTab === 'profile' && (
           <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400">
                    {shopLogo ? (
                      <img src={shopLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Nome da Loja</label>
                    <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Boutique 93" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider">URL do Logotipo</label>
                    <input type="text" value={shopLogo} onChange={(e) => setShopLogo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button type="submit" className="bg-indigo-900 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-950 transition-all active:scale-95">
                  Salvar Alterações
                </button>
              </div>
           </form>
        )}

        {activeTab === 'backup' && (
           <div className="space-y-8 animate-in fade-in duration-300">
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 max-w-2xl">
                <p className="text-xs text-amber-900 font-bold leading-relaxed">
                  <span className="font-black uppercase block mb-1">Backup de Segurança:</span> 
                  Mantenha uma cópia de seus dados em local seguro. Recomenda-se exportar após grandes volumes de lançamentos.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h3 className="text-sm font-black text-slate-900 uppercase italic">Exportar Dados</h3>
                   <p className="text-xs text-slate-500 font-medium">Baixe um arquivo contendo clientes, produtos e vendas.</p>
                   <button onClick={handleExport} className="w-full bg-indigo-900 text-white px-6 py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-950 transition">
                     Download Backup .JSON
                   </button>
                </div>
                <div className="space-y-4">
                   <h3 className="text-sm font-black text-slate-900 uppercase italic">Importar Dados</h3>
                   <p className="text-xs text-slate-500 font-medium">Restaurar sistema a partir de um backup anterior.</p>
                   <label className="block w-full cursor-pointer bg-slate-100 text-slate-700 px-6 py-4 rounded-xl text-xs font-black uppercase text-center border border-slate-200 hover:bg-slate-200 transition">
                      Selecionar Arquivo
                      <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                   </label>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'credits' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Idealização & Tecnologia</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.3em]">Gestão 93 - Vendas a Prazo</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Idealizador */}
              <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 flex flex-col items-center text-center group hover:shadow-xl transition-all duration-300">
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Idealista & Visionário</h4>
                <p className="text-xl font-black text-indigo-950 uppercase italic">Cássio Ribeiro de Freitas</p>
                <p className="text-xs text-indigo-700 mt-4 font-bold leading-relaxed max-w-[200px]">Responsável pela concepção estratégica e lógica de negócios do Gestão 93.</p>
              </div>

              {/* Tecnologias */}
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col items-center text-center group hover:shadow-xl transition-all duration-300">
                <div className="flex gap-4 mb-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md -rotate-3 group-hover:rotate-0 transition-transform p-3">
                    <img src="https://www.gstatic.com/images/branding/product/2x/google_64dp.png" alt="Google" className="w-full" />
                  </div>
                  <div className="w-14 h-14 bg-indigo-900 rounded-2xl flex items-center justify-center shadow-md rotate-3 group-hover:rotate-0 transition-transform p-3">
                    <svg className="w-full text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z"/></svg>
                  </div>
                </div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tecnologia & IA</h4>
                <p className="text-xl font-black text-slate-900 uppercase italic">Google & Gemini 3</p>
                <p className="text-xs text-slate-600 mt-4 font-bold leading-relaxed">Desenvolvido com a potência da Inteligência Artificial do Google para insights financeiros inteligentes.</p>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em]">Versão 2.5 - Estável</p>
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
           <div className="max-w-xl space-y-6 animate-in fade-in duration-300">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                 <h3 className="text-sm font-black text-rose-900 uppercase mb-2">Zona de Perigo</h3>
                 <p className="text-xs text-rose-700 leading-relaxed font-bold uppercase tracking-tight">Esta ação apagará todos os dados de Clientes, Produtos e Vendas deste navegador de forma permanente.</p>
              </div>
              <button 
                onClick={() => { if (confirm('TEM CERTEZA? Isso não pode ser desfeito.')) onClear(); }} 
                className="w-full bg-rose-600 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg hover:bg-rose-700 transition-all active:scale-95"
              >
                Zerar Todo o Sistema
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
