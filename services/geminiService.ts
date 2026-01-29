
import { GoogleGenAI } from "@google/genai";
import { Sale, Customer } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants for quota management
const COOLDOWN_TIME = 60000; // 1 minute
let cooldownUntil = 0;

export const getFinancialInsights = async (
  sales: Sale[],
  customers: Customer[]
) => {
  const now = Date.now();
  if (now < cooldownUntil) {
    const secondsLeft = Math.ceil((cooldownUntil - now) / 1000);
    return `⚠️ IA em repouso por limite de cota. Tente novamente em ${secondsLeft}s.`;
  }

  if (sales.length === 0) return "Adicione vendas para análise.";

  // Generate a cache key based on data state
  const context = {
    s: sales.length,
    v: sales.reduce((acc, s) => acc + s.totalAmount, 0),
    c: customers.length,
    p: sales.flatMap(s => s.installments).filter(i => i.status !== 'PAID').length,
  };
  const cacheKey = `gemini_cache_${JSON.stringify(context)}`;
  const cached = sessionStorage.getItem(cacheKey);
  
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise brevemente (máx 300 caracteres): Loja com ${context.s} vendas (R$ ${context.v}), ${context.c} clientes e ${context.p} parcelas abertas. Foco em saúde do caixa.`,
      config: {
        temperature: 0.5,
        maxOutputTokens: 200,
      }
    });

    const text = response.text || "Insights não disponíveis no momento.";
    sessionStorage.setItem(cacheKey, text);
    return text;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error?.message?.includes("429") || error?.status === 429) {
      cooldownUntil = Date.now() + COOLDOWN_TIME;
      return "⚠️ Cota excedida no Google Gemini. O sistema entrou em modo de espera de 1 minuto para evitar bloqueios. Seus dados de vendas permanecem salvos.";
    }
    
    return "Falha na comunicação com a IA. Tente atualizar a página.";
  }
};
