'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  getInvoiceCustomerName,
  getInvoiceStatusClasses,
  invoiceStatusLabels,
} from '@/lib/invoice-utils';
import {
  downloadInvoicePdf,
  getInvoices,
} from '@/lib/invoices-api';
import {
  invoiceStatuses,
  type Invoice,
} from '@/types/invoice';

export default function InvoicesPage() {
  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    downloadingInvoiceId,
    setDownloadingInvoiceId,
  ] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInvoices() {
      try {
        const data = await getInvoices();

        if (!cancelled) {
          setInvoices(data);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The invoices could not be loaded.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInvoices();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePdfDownload(
    invoice: Invoice,
  ): Promise<void> {
    setDownloadingInvoiceId(invoice.id);
    setError('');

    try {
      await downloadInvoicePdf(invoice);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The invoice PDF could not be downloaded.',
      );
    } finally {
      setDownloadingInvoiceId(null);
    }
  }

  const filteredInvoices = useMemo(() => {
    const cleanSearch =
      search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesStatus =
        !status ||
        invoice.status === status;

      const customerName =
        getInvoiceCustomerName(
          invoice.customer,
        ).toLowerCase();

      const matchesSearch =
        !cleanSearch ||
        invoice.invoiceNo
          .toLowerCase()
          .includes(cleanSearch) ||
        invoice.shipment.shipmentNo
          .toLowerCase()
          .includes(cleanSearch) ||
        customerName.includes(cleanSearch);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    invoices,
    search,
    status,
  ]);

  const totalValue = filteredInvoices.reduce(
    (sum, invoice) =>
      sum + Number(invoice.total),
    0,
  );

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="font-semibold text-slate-700">
          Loading invoices...
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Billing management
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Invoices
          </h1>

          <p className="mt-2 text-slate-600">
            Create and manage customer invoices.
          </p>
        </div>

        <Link
          href="/dashboard/invoices/new"
          className="rounded-lg bg-slate-950 px-5 py-3 text-center font-semibold text-white hover:bg-slate-800"
        >
          Create Invoice
        </Link>
      </header>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          label="Invoices"
          value={String(filteredInvoices.length)}
        />

        <SummaryCard
          label="Paid"
          value={String(
            filteredInvoices.filter(
              (invoice) =>
                invoice.status === 'PAID',
            ).length,
          )}
        />

        <SummaryCard
          label="Visible total"
          value={formatInvoiceCurrency(
            totalValue,
            filteredInvoices[0]?.currency ??
              'EUR',
          )}
        />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <label>
            <span className="text-sm font-semibold text-slate-700">
              Search
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Invoice, shipment or customer"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">
                All statuses
              </option>

              {invoiceStatuses.map(
                (statusValue) => (
                  <option
                    key={statusValue}
                    value={statusValue}
                  >
                    {
                      invoiceStatusLabels[
                        statusValue
                      ]
                    }
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </section>
      )}

      {!error &&
        filteredInvoices.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="font-semibold text-slate-700">
              No invoices found
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create the first invoice or adjust
              the filters.
            </p>
          </section>
        )}

      {!error &&
        filteredInvoices.length > 0 && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>
                      Invoice
                    </TableHeading>

                    <TableHeading>
                      Customer
                    </TableHeading>

                    <TableHeading>
                      Shipment
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Issue date
                    </TableHeading>

                    <TableHeading>
                      Total
                    </TableHeading>

                    <TableHeading>
                      Action
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(
                    (invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-slate-50"
                      >
                        <TableCell>
                          <span className="font-semibold text-slate-950">
                            {invoice.invoiceNo}
                          </span>
                        </TableCell>

                        <TableCell>
                          {getInvoiceCustomerName(
                            invoice.customer,
                          )}
                        </TableCell>

                        <TableCell>
                          {invoice.shipment.shipmentNo}
                        </TableCell>

                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getInvoiceStatusClasses(
                              invoice.status,
                            )}`}
                          >
                            {
                              invoiceStatusLabels[
                                invoice.status
                              ]
                            }
                          </span>
                        </TableCell>

                        <TableCell>
                          {formatInvoiceDate(
                            invoice.issueDate,
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="font-semibold text-slate-950">
                            {formatInvoiceCurrency(
                              invoice.total,
                              invoice.currency,
                            )}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="font-semibold text-sky-700 hover:text-sky-900"
                            >
                              View
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                void handlePdfDownload(
                                  invoice,
                                )
                              }
                              disabled={
                                downloadingInvoiceId ===
                                invoice.id
                              }
                              className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {downloadingInvoiceId ===
                              invoice.id
                                ? 'Preparing...'
                                : 'PDF'}
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
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

      <p className="mt-3 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

type TableContentProps = {
  children: React.ReactNode;
};

function TableHeading({
  children,
}: TableContentProps) {
  return (
    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: TableContentProps) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
      {children}
    </td>
  );
}
