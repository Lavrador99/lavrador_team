import { api } from './axios';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceDto {
  id: string;
  clientId: string;
  amount: number;
  currency: string;
  description: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  client?: { id: string; name: string };
}

export interface InvoiceSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  count: number;
}

export const invoicesApi = {
  create: async (body: {
    clientId: string;
    amount: number;
    currency?: string;
    description: string;
    dueDate: string;
    notes?: string;
  }): Promise<InvoiceDto> => {
    const { data } = await api.post('/invoices', body);
    return data;
  },

  getAll: async (clientId?: string): Promise<InvoiceDto[]> => {
    const { data } = await api.get(`/invoices${clientId ? `?clientId=${clientId}` : ''}`);
    return data;
  },

  getSummary: async (clientId: string): Promise<InvoiceSummary> => {
    const { data } = await api.get(`/invoices/summary/${clientId}`);
    return data;
  },

  update: async (id: string, body: Partial<{ status: InvoiceStatus; amount: number; description: string; dueDate: string; notes: string }>): Promise<InvoiceDto> => {
    const { data } = await api.patch(`/invoices/${id}`, body);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
};
