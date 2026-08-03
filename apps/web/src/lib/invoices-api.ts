import { apiFetch } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-storage';
import type {
  CreateInvoiceInput,
  Invoice,
  InvoiceListFilters,
} from '@/types/invoice';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export function getInvoices(
  filters: InvoiceListFilters = {},
): Promise<Invoice[]> {
  const searchParams = new URLSearchParams();

  if (filters.search?.trim()) {
    searchParams.set(
      'search',
      filters.search.trim(),
    );
  }

  if (filters.status?.trim()) {
    searchParams.set(
      'status',
      filters.status.trim(),
    );
  }

  const query = searchParams.toString();

  return apiFetch<Invoice[]>(
    query
      ? `/invoices?${query}`
      : '/invoices',
  );
}



export function createInvoice(
  input: CreateInvoiceInput,
): Promise<Invoice> {
  return apiFetch<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getInvoice(
  invoiceId: string,
): Promise<Invoice> {
  return apiFetch<Invoice>(
    `/invoices/${invoiceId}`,
  );
}

export function deleteInvoice(
  invoiceId: string,
): Promise<Invoice> {
  return apiFetch<Invoice>(
    `/invoices/${invoiceId}`,
    {
      method: 'DELETE',
    },
  );
}

export async function downloadInvoicePdf(
  invoice: Invoice,
): Promise<void> {
  const token =
    typeof window !== 'undefined'
      ? getAccessToken()
      : null;

  if (!token) {
    throw new Error(
      'No authentication token was found. Please log in again.',
    );
  }

  const response = await fetch(
    `${API_URL}/invoices/${invoice.id}/pdf`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    let message =
      `PDF download failed with status ${response.status}.`;

    try {
      const body = await response.json();

      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (
        typeof body.message === 'string'
      ) {
        message = body.message;
      }
    } catch {
      // Keep the fallback message.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const objectUrl =
    window.URL.createObjectURL(blob);

  const link =
    window.document.createElement('a');

  link.href = objectUrl;
  link.download = `${invoice.invoiceNo}.pdf`;

  window.document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(objectUrl);
}

