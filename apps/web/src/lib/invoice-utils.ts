import type {
  InvoiceStatus,
} from '@/types/invoice';

export const invoiceStatusLabels: Record<
  InvoiceStatus,
  string
> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export function formatInvoiceCurrency(
  value: string | number,
  currency: string,
): string {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
  }).format(numericValue);
}

export function formatInvoiceDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getInvoiceCustomerName(
  customer: {
    companyName: string | null;
    firstName: string;
    lastName: string;
  },
): string {
  return (
    customer.companyName ||
    `${customer.firstName} ${customer.lastName}`
  );
}

export function getInvoiceStatusClasses(
  status: InvoiceStatus,
): string {
  const classes: Record<
    InvoiceStatus,
    string
  > = {
    DRAFT:
      'bg-slate-100 text-slate-700',
    ISSUED:
      'bg-blue-100 text-blue-700',
    SENT:
      'bg-violet-100 text-violet-700',
    PARTIALLY_PAID:
      'bg-amber-100 text-amber-700',
    PAID:
      'bg-emerald-100 text-emerald-700',
    OVERDUE:
      'bg-red-100 text-red-700',
    CANCELLED:
      'bg-slate-200 text-slate-600',
  };

  return classes[status];
}
