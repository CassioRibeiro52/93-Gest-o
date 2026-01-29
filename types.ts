
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  authProvider?: 'local' | 'onedrive';
  avatarUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  cpf?: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
}

export interface Product {
  id: string;
  sku: string;        // Código do produto
  name: string;
  category: string;
  costPrice: number;  // Preço de custo
  price: number;      // Preço de venda
  stock: number;
  minStock: number;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL'
}

export interface Installment {
  id: string;
  saleId: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: PaymentStatus;
}

export interface Sale {
  id: string;
  customerId: string;
  description: string;
  baseAmount: number;
  discount: number;
  totalAmount: number;
  cardFeeRate?: number;
  cardFeeAmount?: number;
  netAmount: number;
  totalCost: number;   // Custo total dos produtos nesta venda para cálculo de lucro
  date: string;
  installments: Installment[];
  status: PaymentStatus;
  type?: 'cash' | 'credit';
  productId?: string;
}

export type View = 'dashboard' | 'customers' | 'sales-cash' | 'sales-credit' | 'agenda' | 'settings' | 'expenses' | 'inventory';
