
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
  category?: 'fixed' | 'refund' | 'other';
  date?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  price: number;
  stock: number;
  minStock: number;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  CANCELED = 'CANCELED'
}

export interface Installment {
  id: string;
  saleId: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
}

export interface SaleItem {
  id: string;
  productId?: string;
  description: string;
  price: number;
  costPrice: number;
  quantity: number;
}

export interface Sale {
  id: string;
  customerId: string;
  description: string;
  items: SaleItem[];
  baseAmount: number;
  discount: number;
  totalAmount: number;
  cardFeeRate?: number;
  cardFeeAmount?: number;
  netAmount: number;
  totalCost: number;
  date: string;
  installments: Installment[];
  status: PaymentStatus;
  type?: 'cash' | 'credit';
  productId?: string;
}

export interface TrashItem {
  id: string;
  sale: Sale;
  deletedAt: number;
}

export type View = 'dashboard' | 'customers' | 'sales-cash' | 'sales-credit' | 'agenda' | 'settings' | 'expenses' | 'inventory' | 'trash' | 'refunds';
