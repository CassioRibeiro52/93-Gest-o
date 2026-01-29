
import { Product, Sale, PaymentStatus } from '../types';

export const JAN_2026_SPREADSHEET_DATA = {
  products: [
    { id: 'p1', sku: '1', name: 'Short Alfaiataria Zara P', category: 'Roupas', costPrice: 36.20, price: 59.90, stock: 2, minStock: 2 },
    { id: 'p2', sku: '2', name: 'Short Alfaiataria Zara M', category: 'Roupas', costPrice: 36.20, price: 59.90, stock: 5, minStock: 2 },
    { id: 'p3', sku: '3', name: 'Short Alfaiataria Zara G', category: 'Roupas', costPrice: 36.20, price: 59.90, stock: 1, minStock: 1 },
    { id: 'p4', sku: '4', name: 'Short Jeans Mikron 38', category: 'Roupas', costPrice: 33.00, price: 70.00, stock: 2, minStock: 1 },
    { id: 'p5', sku: '5', name: 'Calça Jeans 44', category: 'Roupas', costPrice: 60.00, price: 120.00, stock: 2, minStock: 2 },
    { id: 'p6', sku: '6', name: 'Calça Jeans 38', category: 'Roupas', costPrice: 60.00, price: 120.00, stock: 1, minStock: 1 },
    { id: 'p7', sku: '7', name: 'Macacão Tule', category: 'Roupas', costPrice: 71.15, price: 124.90, stock: 0, minStock: 1 },
    { id: 'p8', sku: '8', name: 'Conjunto Short Fit Meia Cx M', category: 'Roupas', costPrice: 42.50, price: 100.00, stock: 2, minStock: 1 },
    { id: 'p9', sku: '9', name: 'Calça Jeans Variadas', category: 'Roupas', costPrice: 63.50, price: 130.00, stock: 6, minStock: 2 },
    { id: 'p10', sku: '10', name: 'Conjunto Joguer Acetinado', category: 'Roupas', costPrice: 126.15, price: 170.00, stock: 2, minStock: 1 },
    { id: 'a1', sku: '11', name: 'Brinco F1', category: 'Acessórios (Brincos)', costPrice: 3.51, price: 10.00, stock: 6, minStock: 2 },
    { id: 'a2', sku: '12', name: 'Brinco F3', category: 'Acessórios (Brincos)', costPrice: 6.68, price: 15.00, stock: 8, minStock: 2 },
    { id: 'a3', sku: '13', name: 'Brinco F5', category: 'Acessórios (Brincos)', costPrice: 9.67, price: 20.00, stock: 11, minStock: 2 },
    { id: 'a5', sku: '14', name: 'Anel F1', category: 'Acessórios (Anéis)', costPrice: 4.88, price: 10.00, stock: 13, minStock: 3 },
    { id: 'a7', sku: '15', name: 'Conjunto Acessório F2', category: 'Acessórios (Conjuntos)', costPrice: 19.17, price: 49.98, stock: 4, minStock: 1 },
    { id: 'a9', sku: '16', name: 'Bracelete S2', category: 'Acessórios (Braceletes)', costPrice: 40.00, price: 84.98, stock: 0, minStock: 1 },
  ] as Product[],
  sales: [
    { id: 's1', customerId: 'BALCAO', description: 'Venda: Calça Jeans 44', baseAmount: 120, discount: 0, totalAmount: 120, netAmount: 120, totalCost: 60, date: '2026-01-05', status: PaymentStatus.PAID, type: 'cash', productId: 'p5', installments: [] },
    { id: 's2', customerId: 'BALCAO', description: 'Venda: Calça Jeans 38', baseAmount: 120, discount: 0, totalAmount: 120, netAmount: 120, totalCost: 60, date: '2026-01-08', status: PaymentStatus.PAID, type: 'cash', productId: 'p6', installments: [] },
    { id: 's3', customerId: 'BALCAO', description: 'Venda: Macacão Tule', baseAmount: 124.90, discount: 0, totalAmount: 124.90, netAmount: 124.90, totalCost: 71.15, date: '2026-01-10', status: PaymentStatus.PAID, type: 'cash', productId: 'p7', installments: [] },
  ] as Sale[]
};
