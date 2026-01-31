
import React, { useState } from 'react';
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
        setMessage(`Instruções de recuperação enviadas para ${email}.`);
        setTimeout(() => setIsRecovery(false), 3000);
      } else {
        setError('E-mail não encontrado na base local.');
      }
      return;
    }

    if (isRegistering) {
      if (!name || !email || !password) {
        setError('Preencha todos os campos.');
        return;
      }
      if (savedUsers.find((u: User) => u.email === email)) {
        setError('Este e-mail já está cadastrado.');
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

  const handleSimulatedOneDriveLogin = () => {
    setIsAuthenticating(true);
    const simulatedEmail = prompt("Digite seu e-mail Microsoft para simular login:", "loja93@outlook.com");
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
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="md:w-1/2 lg:w-3/5 relative h-[40vh] md:h-screen overflow-hidden">
        <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover" alt="Loja" />
        <div className="absolute inset-0 bg-indigo-950/30"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-24 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-2xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter">Gestão 93</h1>
          </div>
          <p className="text-lg md:text-2xl font-bold italic drop-shadow-lg">“Lute Pelos seus Sonhos hoje !”</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-8 md:p-12 bg-slate-50 relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase">
              {isRecovery ? 'Recuperar Acesso' : isRegistering ? 'Criar Nova Loja' : 'Acesse seu Painel'}
            </h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Controle de Vendas Profissional</p>
          </div>

          {!isRecovery && (
            <div className="space-y-4">
              <button 
                onClick={handleSimulatedOneDriveLogin}
                disabled={isAuthenticating}
                className="w-full bg-white border-2 border-indigo-100 text-indigo-900 font-black py-4 rounded-2xl hover:bg-indigo-50 transition shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019-present%29.svg" className="h-6" alt="OneDrive" />
                    Entrar com Conta Microsoft
                  </>
                )}
              </button>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-slate-50 px-4 text-slate-400 font-black">Ou Login Local</span></div>
              </div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da Loja" required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500" />
            {!isRecovery && (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500" />
            )}
            {error && <p className="text-rose-600 text-[11px] font-black bg-rose-50 p-2 rounded">{error}</p>}
            {message && <p className="text-emerald-600 text-[11px] font-black bg-emerald-50 p-2 rounded">{message}</p>}
            <button type="submit" className="w-full bg-indigo-900 text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm hover:bg-indigo-950 transition shadow-lg">
              {isRecovery ? 'Recuperar' : isRegistering ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setIsRecovery(false); }} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">
              {isRegistering ? 'Já tenho uma conta? Entrar' : 'Novo por aqui? Criar conta local'}
            </button>
            {!isRegistering && (
               <button onClick={() => setIsRecovery(!isRecovery)} className="text-[10px] font-black text-slate-400 uppercase hover:underline">
                 {isRecovery ? 'Voltar ao Login' : 'Esqueceu a senha?'}
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
