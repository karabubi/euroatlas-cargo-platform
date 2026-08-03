'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { apiFetch } from '@/lib/api';
import { createInvoice } from '@/lib/invoices-api';
import { formatInvoiceCurrency } from '@/lib/invoice-utils';
import type {
  CreateInvoiceItemInput,
  InvoiceFormCustomer,
  InvoiceFormShipment,
} from '@/types/invoice';

type EditableInvoiceItem = {
  localId: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

const initialItem: EditableInvoiceItem = {
  localId: 'item-1',
  description: '',
  quantity: '1',
  unitPrice: '',
};

function getCustomerName(
  customer: InvoiceFormCustomer,
): string {
  return (
    customer.companyName ||
    `${customer.firstName} ${customer.lastName}`
  );
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateInvoicePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<
    InvoiceFormCustomer[]
  >([]);

  const [shipments, setShipments] = useState<
    InvoiceFormShipment[]
  >([]);

  const [customerId, setCustomerId] = useState('');
  const [shipmentId, setShipmentId] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [issueDate, setIssueDate] =
    useState(todayInputValue());
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState('19');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] =
    useState('Payment due within 14 days.');

  const [items, setItems] =
    useState<EditableInvoiceItem[]>([
      initialItem,
    ]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [customerData, shipmentData] =
          await Promise.all([
            apiFetch<InvoiceFormCustomer[]>(
              '/customers',
            ),
            apiFetch<InvoiceFormShipment[]>(
              '/shipments',
            ),
          ]);

        if (!cancelled) {
          setCustomers(customerData);
          setShipments(shipmentData);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Customers and shipments could not be loaded.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  const availableShipments = useMemo(
    () =>
      customerId
        ? shipments.filter(
            (shipment) =>
              shipment.customerId === customerId,
          )
        : [],
    [customerId, shipments],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (
          !Number.isFinite(quantity) ||
          !Number.isFinite(unitPrice)
        ) {
          return sum;
        }

        return sum + quantity * unitPrice;
      }, 0),
    [items],
  );

  const numericTaxRate = Number(taxRate) || 0;
  const taxAmount =
    subtotal * numericTaxRate / 100;
  const total = subtotal + taxAmount;

  function updateItem(
    localId: string,
    field:
      | 'description'
      | 'quantity'
      | 'unitPrice',
    value: string,
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.localId === localId
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [
      ...currentItems,
      {
        localId: `item-${Date.now()}`,
        description: '',
        quantity: '1',
        unitPrice: '',
      },
    ]);
  }

  function removeItem(localId: string) {
    setItems((currentItems) => {
      if (currentItems.length === 1) {
        return currentItems;
      }

      return currentItems.filter(
        (item) => item.localId !== localId,
      );
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');

    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (!shipmentId) {
      setError('Please select a shipment.');
      return;
    }

    if (
      !Number.isFinite(numericTaxRate) ||
      numericTaxRate < 0
    ) {
      setError('Please enter a valid tax rate.');
      return;
    }

    const preparedItems:
      CreateInvoiceItemInput[] = [];

    for (
      let index = 0;
      index < items.length;
      index += 1
    ) {
      const item = items[index];
      const description =
        item.description.trim();
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (!description) {
        setError(
          `Please enter a description for item ${index + 1}.`,
        );
        return;
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        setError(
          `Item ${index + 1} requires a valid quantity.`,
        );
        return;
      }

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        setError(
          `Item ${index + 1} requires a valid unit price.`,
        );
        return;
      }

      preparedItems.push({
        description,
        quantity,
        unitPrice,
        position: index,
      });
    }

    setIsSubmitting(true);

    try {
      await createInvoice({
        customerId,
        shipmentId,
        currency,
        issueDate: issueDate || undefined,
        dueDate: dueDate || undefined,
        taxRate: numericTaxRate,
        notes: notes.trim() || undefined,
        paymentTerms:
          paymentTerms.trim() || undefined,
        items: preparedItems,
      });

      router.push('/dashboard/invoices');
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The invoice could not be created.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="font-semibold text-slate-700">
          Loading invoice form...
        </p>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Billing management
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Create Invoice
          </h1>

          <p className="mt-2 text-slate-600">
            Create an invoice for an existing
            customer shipment.
          </p>
        </div>

        <Link
          href="/dashboard/invoices"
          className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Invoices
        </Link>
      </header>

      {error && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </section>
      )}

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Invoice information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <FieldLabel label="Customer *">
            <select
              value={customerId}
              onChange={(event) => {
                setCustomerId(event.target.value);
                setShipmentId('');
              }}
              disabled={isSubmitting}
              className="input-field"
            >
              <option value="">
                Select customer
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.customerNo} —{' '}
                  {getCustomerName(customer)}
                </option>
              ))}
            </select>
          </FieldLabel>

          <FieldLabel label="Shipment *">
            <select
              value={shipmentId}
              onChange={(event) =>
                setShipmentId(event.target.value)
              }
              disabled={
                !customerId || isSubmitting
              }
              className="input-field disabled:bg-slate-100"
            >
              <option value="">
                Select shipment
              </option>

              {availableShipments.map(
                (shipment) => (
                  <option
                    key={shipment.id}
                    value={shipment.id}
                  >
                    {shipment.shipmentNo} —{' '}
                    {shipment.originCountry}
                    {' → '}
                    {shipment.destinationCountry}
                  </option>
                ),
              )}
            </select>
          </FieldLabel>

          <FieldLabel label="Currency">
            <select
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value)
              }
              disabled={isSubmitting}
              className="input-field"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </FieldLabel>

          <FieldLabel label="Issue date">
            <input
              type="date"
              value={issueDate}
              onChange={(event) =>
                setIssueDate(event.target.value)
              }
              disabled={isSubmitting}
              className="input-field"
            />
          </FieldLabel>

          <FieldLabel label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              disabled={isSubmitting}
              className="input-field"
            />
          </FieldLabel>

          <FieldLabel label="Tax rate %">
            <input
              type="number"
              min="0"
              step="0.01"
              value={taxRate}
              onChange={(event) =>
                setTaxRate(event.target.value)
              }
              disabled={isSubmitting}
              className="input-field"
            />
          </FieldLabel>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              Invoice items
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Add freight, customs, insurance and
              other services.
            </p>
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={isSubmitting}
            className="rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            Add Item
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {items.map((item, index) => {
            const amount =
              (Number(item.quantity) || 0) *
              (Number(item.unitPrice) || 0);

            return (
              <article
                key={item.localId}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_130px_170px_150px_auto] lg:items-end">
                  <FieldLabel label="Description *">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(event) =>
                        updateItem(
                          item.localId,
                          'description',
                          event.target.value,
                        )
                      }
                      placeholder="Ocean freight"
                      disabled={isSubmitting}
                      className="input-field"
                    />
                  </FieldLabel>

                  <FieldLabel label="Quantity">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(
                          item.localId,
                          'quantity',
                          event.target.value,
                        )
                      }
                      disabled={isSubmitting}
                      className="input-field"
                    />
                  </FieldLabel>

                  <FieldLabel label="Unit price">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(event) =>
                        updateItem(
                          item.localId,
                          'unitPrice',
                          event.target.value,
                        )
                      }
                      disabled={isSubmitting}
                      className="input-field"
                    />
                  </FieldLabel>

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Amount
                    </p>

                    <p className="mt-2 rounded-lg bg-white px-4 py-3 font-bold text-slate-950">
                      {formatInvoiceCurrency(
                        amount,
                        currency,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeItem(item.localId)
                    }
                    disabled={
                      items.length === 1 ||
                      isSubmitting
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Item {index + 1}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Additional information
          </h2>

          <FieldLabel label="Payment terms">
            <textarea
              value={paymentTerms}
              onChange={(event) =>
                setPaymentTerms(
                  event.target.value,
                )
              }
              rows={3}
              disabled={isSubmitting}
              className="input-field resize-y"
            />
          </FieldLabel>

          <div className="mt-5">
            <FieldLabel label="Notes">
              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={4}
                disabled={isSubmitting}
                placeholder="Optional invoice notes"
                className="input-field resize-y"
              />
            </FieldLabel>
          </div>
        </div>

        <aside className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
          <h2 className="text-xl font-bold">
            Invoice summary
          </h2>

          <div className="mt-6 space-y-4">
            <SummaryRow
              label="Subtotal"
              value={formatInvoiceCurrency(
                subtotal,
                currency,
              )}
            />

            <SummaryRow
              label={`Tax (${numericTaxRate}%)`}
              value={formatInvoiceCurrency(
                taxAmount,
                currency,
              )}
            />

            <div className="border-t border-slate-700 pt-4">
              <SummaryRow
                label="Total"
                value={formatInvoiceCurrency(
                  total,
                  currency,
                )}
                prominent
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-lg bg-sky-500 px-5 py-3 font-bold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? 'Creating Invoice...'
              : 'Create Invoice'}
          </button>
        </aside>
      </section>
    </form>
  );
}

type FieldLabelProps = {
  label: string;
  children: React.ReactNode;
};

function FieldLabel({
  label,
  children,
}: FieldLabelProps) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <div className="mt-2">
        {children}
      </div>
    </label>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  prominent?: boolean;
};

function SummaryRow({
  label,
  value,
  prominent = false,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          prominent
            ? 'font-bold text-white'
            : 'text-sm text-slate-400'
        }
      >
        {label}
      </span>

      <span
        className={
          prominent
            ? 'text-2xl font-bold text-white'
            : 'font-semibold text-white'
        }
      >
        {value}
      </span>
    </div>
  );
}
