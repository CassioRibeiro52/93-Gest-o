
import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';

interface TutorialProps {
  onClose: () => void;
  activeView: string;
}

interface Step {
  id: string;
  targetId: string;
  title: string;
  content: string;
}

const Tutorial: React.FC<TutorialProps> = ({ onClose, activeView }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState<{ top: number, left: number, width: number, height: number } | null>(null);

  const steps: Step[] = [
    {
      id: 'step-dashboard',
      targetId: 'nav-dashboard',
      title: 'Bem-vindo ao Gestão 93!',
      content: 'Este é o seu painel principal. Aqui você verá o lucro real das suas vendas, faturamento e insights da nossa Inteligência Artificial.',
    },
    {
      id: 'step-inventory',
      targetId: 'nav-inventory',
      title: 'Passo 1: Seu Estoque',
      content: 'Antes de vender, cadastre seus produtos aqui. É fundamental informar o Preço de Custo e o Preço de Venda para o sistema calcular seu lucro automaticamente.',
    },
    {
      id: 'step-customers',
      targetId: 'nav-customers',
      title: 'Passo 2: Clientes',
      content: 'Cadastre suas clientes para gerenciar quem está devendo e o histórico de compras de cada uma.',
    },
    {
      id: 'step-sales',
      targetId: 'nav-sales-credit',
      title: 'Passo 3: Vendas a Prazo',
      content: 'Vendeu no "fiado" ou parcelado? Lance aqui! O sistema gera as parcelas e te avisa no dia do vencimento.',
    },
    {
      id: 'step-agenda',
      targetId: 'nav-agenda',
      title: 'Passo 4: Agenda de Recebimento',
      content: 'Consulte mês a mês quanto você tem para receber. O dinheiro que está "na rua" fica organizado aqui.',
    },
    {
        id: 'step-expenses',
        targetId: 'nav-expenses',
        title: 'Passo 5: Despesas Fixas',
        content: 'Lance seus custos fixos (Aluguel, MEI, Luz) para que o lucro do Dashboard seja o valor real que sobra no seu bolso.',
    }
  ];

  const updateCoords = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;
    
    const element = document.getElementById(step.targetId);
    if (element) {
      const rect = element.getBoundingClientRect();
      // Only set if element has actual dimensions and is visible
      if (rect.width > 0 && rect.height > 0) {
        setCoords({ 
            top: rect.top, 
            left: rect.left, 
            width: rect.width, 
            height: rect.height 
        });
        return;
      }
    }
    setCoords(null);
  }, [currentStep]);

  // Use both effects to ensure we catch the element after render and on step change
  useLayoutEffect(() => {
    // Small delay to ensure DOM is fully ready and reflowed
    const timer = setTimeout(updateCoords, 100);
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords, true);
    
    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', updateCoords, true);
    };
  }, [currentStep, updateCoords, activeView]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Overlay with spotlight hole */}
      <div 
        className="absolute inset-0 bg-slate-950/80 pointer-events-auto transition-all duration-300"
        style={{ 
            clipPath: coords 
                ? `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)` 
                : 'none' 
        }}
      />

      {/* Pulsing highlight border */}
      {coords && (
        <div className="absolute border-2 border-indigo-400 rounded-lg shadow-[0_0_30px_rgba(129,140,248,0.6)] animate-pulse"
          style={{ 
              top: coords.top - 4, 
              left: coords.left - 4, 
              width: coords.width + 8, 
              height: coords.height + 8,
              transition: 'all 0.3s ease-out'
          }}
        />
      )}

      {/* Tooltip Box */}
      <div className="absolute pointer-events-auto transition-all duration-500 ease-out z-[10000]"
        style={{ 
            top: coords 
                ? (coords.top + coords.height + 20 > window.innerHeight - 240 ? coords.top - 240 : coords.top + coords.height + 20) 
                : '50%', 
            left: coords 
                ? Math.min(Math.max(20, coords.left), window.innerWidth - 340) 
                : '50%', 
            transform: coords ? 'none' : 'translate(-50%, -50%)', 
            width: '320px' 
        }}
      >
        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-indigo-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
          
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-1 rounded-lg tracking-widest">
                Dica {currentStep + 1} de {steps.length}
            </span>
            <button onClick={onClose} className="text-slate-300 hover:text-rose-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <h4 className="text-xl font-black text-slate-800 mb-2 italic uppercase tracking-tight leading-tight">
            {currentStepData.title}
          </h4>
          
          <p className="text-sm text-slate-500 leading-relaxed mb-8 font-medium">
            {currentStepData.content}
          </p>

          <div className="flex items-center justify-between">
             <button 
                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)} 
                disabled={currentStep === 0} 
                className="text-xs font-black text-slate-400 uppercase tracking-widest disabled:opacity-0 transition hover:text-indigo-600"
             >
                Anterior
             </button>
             <button 
                onClick={handleNext} 
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
             >
                {currentStep === steps.length - 1 ? 'Finalizar' : 'Entendido'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
