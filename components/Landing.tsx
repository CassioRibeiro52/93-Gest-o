
import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LandingProps {
  onLogin: (user: User) => void;
}

const Landing: React.FC<LandingProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const getSavedUsers = (): User[] => {
    try {
      const users = localStorage.getItem('gestao93_users');
      return users ? JSON.parse(users) : [];
    } catch { return []; }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const savedUsers = getSavedUsers();

    if (isRecovery) {
      const user = savedUsers.find((u: User) => u.email === email);
      if (user) {
        setMessage(`Simulação: Instruções enviadas para ${email}.`);
        setTimeout(() => setIsRecovery(false), 3000);
      } else {
        setError('E-mail não encontrado.');
      }
      return;
    }

    if (isRegistering) {
      if (!name || !email || !password) {
        setError('Preencha todos os campos.');
        return;
      }
      if (savedUsers.find((u: User) => u.email === email)) {
        setError('Este e-mail já existe.');
        return;
      }
      const newUser: User = { 
        id: Math.random().toString(36).substr(2, 9), 
        name, 
        email, 
        password,
        authProvider: 'local'
      };
      const updatedUsers = [...savedUsers, newUser];
      localStorage.setItem('gestao93_users', JSON.stringify(updatedUsers));
      localStorage.setItem('gestao93_current_user', JSON.stringify(newUser));
      onLogin(newUser);
    } else {
      const user = savedUsers.find((u: User) => u.email === email && u.password === password);
      if (user) {
        localStorage.setItem('gestao93_current_user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('E-mail ou senha incorretos.');
      }
    }
  };

  const handleOneDriveLogin = async () => {
    setIsAuthenticating(true);
    const simulatedEmail = prompt("E-mail Outlook/Hotmail (Simulação):", "loja93@outlook.com");
    if (!simulatedEmail) {
      setIsAuthenticating(false);
      return;
    }
    setTimeout(() => {
      const msUser: User = {
        id: `ms_${btoa(simulatedEmail).substr(0, 10)}`,
        name: simulatedEmail.split('@')[0].toUpperCase(),
        email: simulatedEmail,
        authProvider: 'onedrive',
        avatarUrl: `https://ui-avatars.com/api/?name=${simulatedEmail}&background=4f46e5&color=fff`
      };
      localStorage.setItem('gestao93_current_user', JSON.stringify(msUser));
      onLogin(msUser);
      setIsAuthenticating(false);
    }, 1000);
  };

  const handleEmergencyReset = () => {
    if (confirm("Isso limpará APENAS a sessão atual para destravar o app. Seus dados salvos em contas locais não serão apagados. Deseja continuar?")) {
      localStorage.removeItem('gestao93_current_user');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="md:w-1/2 lg:w-3/5 relative h-[45vh] md:h-screen overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600" 
          className="absolute inset-0 w-full h-full object-cover" 
          alt="Loja" 
        />
        <div className="absolute inset-0 bg-indigo-950/30"></div>
        <div className="absolute inset-0 flex flex-col justify-end md:justify-center p-8 md:p-24 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-2xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic uppercase drop-shadow-2xl">Gestão 93</h1>
          </div>
          <p className="text-lg md:text-2xl font-bold italic text-white drop-shadow-lg max-w-xl leading-tight">
            “Lute Pelos seus Sonhos hoje !”
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-slate-50 relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">
              {isRecovery ? 'Recuperar Acesso' : isRegistering ? 'Criar Loja' : 'Acessar Painel'}
            </h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Controle de Vendas a Prazo</p>
          </div>

          <div className="space-y-4">
            {!isRecovery && (
              <div className="space-y-3">
                <button 
                  onClick={handleOneDriveLogin}
                  disabled={isAuthenticating}
                  className="w-full bg-indigo-50 border-2 border-indigo-100 text-indigo-900 font-black py-4 rounded-2xl hover:bg-indigo-100 transition shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isAuthenticating ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019-present%29.svg" className="h-6" alt="OneDrive" />}
                  Entrar com OneDrive
                </button>
                <p className="text-[10px] text-indigo-600 font-black text-center uppercase tracking-tighter px-4">
                  RECOMENDADO: Use o OneDrive para manter seus dados salvos na nuvem automaticamente.
                </p>
              </div>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-50 px-4 text-slate-400 font-black">Ou Acesso Local</span></div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-800 uppercase ml-1 tracking-widest">Nome da Loja</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Boutique 93" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-800 uppercase ml-1 tracking-widest">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="seu@email.com" />
              </div>
              {!isRecovery && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Senha</label>
                    <button type="button" onClick={() => setIsRecovery(true)} className="text-[10px] font-black text-indigo-700 uppercase hover:underline">Esqueceu?</button>
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-black focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                </div>
              )}

              {error && <p className="text-rose-700 text-[11px] font-black bg-rose-50 p-3 rounded-lg border border-rose-200">{error}</p>}
              {message && <p className="text-emerald-800 text-[11px] font-black bg-emerald-50 p-3 rounded-lg border border-emerald-200">{message}</p>}

              <button type="submit" className="w-full bg-indigo-900 text-white font-black py-4 rounded-xl hover:bg-indigo-950 transition shadow-lg uppercase tracking-widest text-sm">
                {isRecovery ? 'Enviar' : isRegistering ? 'Cadastrar Loja' : 'Entrar Agora'}
              </button>
            </form>

            <div className="text-center pt-4 space-y-4">
              <button onClick={() => { setIsRegistering(!isRegistering); setIsRecovery(false); }} className="text-[10px] font-black text-indigo-800 hover:underline uppercase tracking-widest">
                {isRegistering ? 'Já tenho conta? Entrar' : 'Novo por aqui? Criar conta local'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
           <button onClick={handleEmergencyReset} className="text-[10px] text-slate-600 uppercase font-black hover:text-rose-700 underline tracking-tighter">Destravar App</button>
           <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[10px] text-slate-600 uppercase font-black hover:text-indigo-700 underline tracking-tighter">Documentação API</a>
        </div>
      </div>
    </div>
  );
};

export default Landing;
