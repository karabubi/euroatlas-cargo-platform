export const invoiceStatuses = [
  'DRAFT',
  'ISSUED',
  'SENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;

export type InvoiceStatus =
  (typeof invoiceStatuses)[number];

export type InvoiceCustomer = {
  id: string;
  customerNo: string;
  companyName: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
};

export type InvoiceShipment = {
  id: string;
  shipmentNo: string;
  originCountry: string;
  destinationCountry: string;
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Invoice = {
  id: string;
  invoiceNo: string;
  customerId: string;
  shipmentId: string;
  status: InvoiceStatus;
  currency: string;

  issueDate: string;
  dueDate: string | null;
  paidAt: string | null;

  subtotal: string;
  taxRate: string;
  taxAmount: string;
  total: string;

  notes: string | null;
  paymentTerms: string | null;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  customer: InvoiceCustomer;
  shipment: InvoiceShipment;
  items: InvoiceItem[];
};

export type InvoiceListFilters = {
  search?: string;
  status?: string;
};

export type CreateInvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  position?: number;
};

export type CreateInvoiceInput = {
  customerId: string;
  shipmentId: string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  taxRate?: number;
  notes?: string;
  paymentTerms?: string;
  items: CreateInvoiceItemInput[];
};

export type InvoiceFormCustomer = {
  id: string;
  customerNo: string;
  companyName: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
};

export type InvoiceFormShipment = {
  id: string;
  shipmentNo: string;
  customerId: string;
  originCountry: string;
  originCity: string | null;
  destinationCountry: string;
  destinationCity: string | null;
  status: string;
};

