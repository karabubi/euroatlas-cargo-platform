'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';

import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  getInvoiceCustomerName,
  invoiceStatusLabels,
} from '@/lib/invoice-utils';
import {
  downloadInvoicePdf,
  getInvoice,
} from '@/lib/invoices-api';
import type {
  Invoice,
} from '@/types/invoice';

function displayValue(
  value: string | null | undefined,
): string {
  return value?.trim() || '—';
}

export default function InvoiceDetailsPage() {
  const params = useParams<{
    id: string;
  }>();

  const invoiceId = params.id;

  const [invoice, setInvoice] =
    useState<Invoice | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isDownloading, setIsDownloading] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadInvoice() {
      try {
        const data =
          await getInvoice(invoiceId);

        if (!cancelled) {
          setInvoice(data);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The invoice could not be loaded.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (invoiceId) {
      void loadInvoice();
    }

    return () => {
      cancelled = true;
    };
  }, [invoiceId]);

  async function handlePdfDownload() {
    if (!invoice) {
      return;
    }

    setIsDownloading(true);
    setError('');

    try {
      await downloadInvoicePdf(invoice);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The PDF could not be downloaded.',
      );
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">
          Loading invoice...
        </p>
      </section>
    );
  }

  if (error || !invoice) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || 'Invoice not found.'}
        </div>

        <Link
          href="/dashboard/invoices"
          className="mt-6 inline-block rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white"
        >
          Back to Invoices
        </Link>
      </section>
    );
  }

  const customerName =
    getInvoiceCustomerName(invoice.customer);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Billing management
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            {invoice.invoiceNo}
          </h1>

          <p className="mt-2 text-slate-600">
            View invoice information, items and totals.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              void handlePdfDownload()
            }
            disabled={isDownloading}
            className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading
              ? 'Preparing PDF...'
              : 'Download PDF'}
          </button>

          <Link
            href="/dashboard/invoices"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Invoices
          </Link>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Status"
          value={
            invoiceStatusLabels[
              invoice.status
            ] || invoice.status
          }
        />

        <SummaryCard
          label="Customer"
          value={customerName}
        />

        <SummaryCard
          label="Shipment"
          value={
            invoice.shipment.shipmentNo
          }
        />

        <SummaryCard
          label="Total"
          value={formatInvoiceCurrency(
            invoice.total,
            invoice.currency,
          )}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DetailsSection title="Invoice information">
          <DetailItem
            label="Invoice number"
            value={invoice.invoiceNo}
          />

          <DetailItem
            label="Status"
            value={
              invoiceStatusLabels[
                invoice.status
              ] || invoice.status
            }
          />

          <DetailItem
            label="Issue date"
            value={formatInvoiceDate(
              invoice.issueDate,
            )}
          />

          <DetailItem
            label="Due date"
            value={formatInvoiceDate(
              invoice.dueDate,
            )}
          />

          <DetailItem
            label="Currency"
            value={invoice.currency}
          />

          <DetailItem
            label="Tax rate"
            value={`${Number(
              invoice.taxRate,
            )}%`}
          />
        </DetailsSection>

        <DetailsSection title="Customer information">
          <DetailItem
            label="Customer number"
            value={
              invoice.customer.customerNo
            }
          />

          <DetailItem
            label="Customer"
            value={customerName}
          />

          <DetailItem
            label="Email"
            value={displayValue(
              invoice.customer.email,
            )}
          />

        </DetailsSection>
      </section>

      <DetailsSection title="Shipment information">
        <DetailItem
          label="Shipment number"
          value={invoice.shipment.shipmentNo}
        />

        <DetailItem
          label="Origin country"
          value={invoice.shipment.originCountry}
        />

        <DetailItem
          label="Destination country"
          value={invoice.shipment.destinationCountry}
        />
      </DetailsSection>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-950">
            Invoice items
          </h2>

          <p className="mt-1 text-slate-600">
            Services and charges included in this invoice.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <TableHeading>
                  Description
                </TableHeading>

                <TableHeading>
                  Quantity
                </TableHeading>

                <TableHeading>
                  Unit price
                </TableHeading>

                <TableHeading>
                  Amount
                </TableHeading>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <TableCell>
                    {item.description}
                  </TableCell>

                  <TableCell>
                    {Number(
                      item.quantity,
                    )}
                  </TableCell>

                  <TableCell>
                    {formatInvoiceCurrency(
                      item.unitPrice,
                      invoice.currency,
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-semibold text-slate-950">
                      {formatInvoiceCurrency(
                        item.amount,
                        invoice.currency,
                      )}
                    </span>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Additional information
          </h2>

          <div className="mt-6 space-y-6">
            <TextBlock
              label="Payment terms"
              value={displayValue(
                invoice.paymentTerms,
              )}
            />

            <TextBlock
              label="Notes"
              value={displayValue(
                invoice.notes,
              )}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <h2 className="text-xl font-bold">
            Invoice totals
          </h2>

          <div className="mt-6 space-y-4">
            <TotalRow
              label="Subtotal"
              value={formatInvoiceCurrency(
                invoice.subtotal,
                invoice.currency,
              )}
            />

            <TotalRow
              label={`Tax (${Number(
                invoice.taxRate,
              )}%)`}
              value={formatInvoiceCurrency(
                invoice.taxAmount,
                invoice.currency,
              )}
            />

            <div className="border-t border-slate-700 pt-4">
              <TotalRow
                label="Total"
                value={formatInvoiceCurrency(
                  invoice.total,
                  invoice.currency,
                )}
                strong
              />
            </div>
          </div>
        </div>
      </section>

      <DetailsSection title="System information">
        <DetailItem
          label="Invoice ID"
          value={invoice.id}
        />

        <DetailItem
          label="Created"
          value={formatInvoiceDate(
            invoice.createdAt,
          )}
        />

        <DetailItem
          label="Last updated"
          value={formatInvoiceDate(
            invoice.updatedAt,
          )}
        />
      </DetailsSection>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-3 break-words text-xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

type DetailsSectionProps = {
  title: string;
  children: React.ReactNode;
};

function DetailsSection({
  title,
  children,
}: DetailsSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">
        {title}
      </h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words text-slate-950">
        {value || '—'}
      </p>
    </div>
  );
}

type TextBlockProps = {
  label: string;
  value: string;
};

function TextBlock({
  label,
  value,
}: TextBlockProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-slate-950">
        {value}
      </p>
    </div>
  );
}

type TableProps = {
  children: React.ReactNode;
};

function TableHeading({
  children,
}: TableProps) {
  return (
    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: TableProps) {
  return (
    <td className="px-6 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}

type TotalRowProps = {
  label: string;
  value: string;
  strong?: boolean;
};

function TotalRow({
  label,
  value,
  strong = false,
}: TotalRowProps) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span
        className={
          strong
            ? 'text-lg font-bold'
            : 'text-slate-300'
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? 'text-2xl font-bold'
            : 'font-semibold'
        }
      >
        {value}
      </span>
    </div>
  );
}
