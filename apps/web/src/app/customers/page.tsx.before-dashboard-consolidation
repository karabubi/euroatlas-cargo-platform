'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { apiFetch } from '@/lib/api';

type Customer = {
  id: string;
  customerNo: string;
  companyName: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  taxNumber: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CustomerFormData = {
  customerNo: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  taxNumber: string;
  notes: string;
  isActive: boolean;
};

const emptyForm: CustomerFormData = {
  customerNo: '',
  companyName: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  postalCode: '',
  city: '',
  country: '',
  taxNumber: '',
  notes: '',
  isActive: true,
};

function customerToForm(customer: Customer): CustomerFormData {
  return {
    customerNo: customer.customerNo,
    companyName: customer.companyName ?? '',
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    mobile: customer.mobile ?? '',
    address: customer.address ?? '',
    postalCode: customer.postalCode ?? '',
    city: customer.city ?? '',
    country: customer.country ?? '',
    taxNumber: customer.taxNumber ?? '',
    notes: customer.notes ?? '',
    isActive: customer.isActive,
  };
}

function preparePayload(form: CustomerFormData) {
  return {
    customerNo: form.customerNo.trim(),
    companyName: form.companyName.trim() || undefined,
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    mobile: form.mobile.trim() || undefined,
    address: form.address.trim() || undefined,
    postalCode: form.postalCode.trim() || undefined,
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    taxNumber: form.taxNumber.trim() || undefined,
    notes: form.notes.trim() || undefined,
    isActive: form.isActive,
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] =
    useState<Customer | null>(null);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadCustomers = useCallback(async (searchValue = '') => {
    setIsPageLoading(true);
    setError('');

    try {
      const query = searchValue.trim()
        ? `?search=${encodeURIComponent(searchValue.trim())}`
        : '';

      const data = await apiFetch<Customer[]>(`/customers${query}`);
      setCustomers(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Customers could not be loaded.',
      );
    } finally {
      setIsPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCustomers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers(search);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, loadCustomers]);

  function updateField(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    if (event.target instanceof HTMLInputElement) {
      if (event.target.type === 'checkbox') {
        setForm((current) => ({
          ...current,
          [name]: (event.target as HTMLInputElement).checked,
        }));
        return;
      }
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openCreateForm() {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError('');
    setSuccessMessage('');
  }

  function openEditForm(customer: Customer) {
    setEditingCustomer(customer);
    setForm(customerToForm(customer));
    setError('');
    setSuccessMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function cancelEditing() {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = preparePayload(form);

      if (editingCustomer) {
        await apiFetch<Customer>(`/customers/${editingCustomer.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        setSuccessMessage('Customer updated successfully.');
      } else {
        await apiFetch<Customer>('/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuccessMessage('Customer created successfully.');
      }

      setEditingCustomer(null);
      setForm(emptyForm);
      await loadCustomers(search);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The customer could not be saved.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!customerToDelete) {
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccessMessage('');

    try {
      await apiFetch<Customer>(`/customers/${customerToDelete.id}`, {
        method: 'DELETE',
      });

      setSuccessMessage('Customer deleted successfully.');
      setCustomerToDelete(null);
      await loadCustomers(search);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The customer could not be deleted.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              EuroAtlas Cargo
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Customers
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, search, edit, and manage customer records.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            New customer
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}

            {error.toLowerCase().includes('log in') && (
              <a
                href="/login"
                className="ml-2 font-semibold underline"
              >
                Go to login
              </a>
            )}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {successMessage}
          </div>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {editingCustomer ? 'Edit customer' : 'Create customer'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Fields marked with * are required.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          >
            <FormField
              label="Customer number *"
              name="customerNo"
              value={form.customerNo}
              onChange={updateField}
              required
              maxLength={50}
              placeholder="CUST-0002"
            />

            <FormField
              label="Company name"
              name="companyName"
              value={form.companyName}
              onChange={updateField}
              maxLength={150}
              placeholder="Example Logistics GmbH"
            />

            <FormField
              label="First name *"
              name="firstName"
              value={form.firstName}
              onChange={updateField}
              required
              maxLength={100}
            />

            <FormField
              label="Last name *"
              name="lastName"
              value={form.lastName}
              onChange={updateField}
              required
              maxLength={100}
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              maxLength={150}
              placeholder="customer@example.com"
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              maxLength={50}
            />

            <FormField
              label="Mobile"
              name="mobile"
              type="tel"
              value={form.mobile}
              onChange={updateField}
              maxLength={50}
            />

            <FormField
              label="Address"
              name="address"
              value={form.address}
              onChange={updateField}
              maxLength={250}
            />

            <FormField
              label="Postal code"
              name="postalCode"
              value={form.postalCode}
              onChange={updateField}
              maxLength={20}
            />

            <FormField
              label="City"
              name="city"
              value={form.city}
              onChange={updateField}
              maxLength={100}
            />

            <FormField
              label="Country"
              name="country"
              value={form.country}
              onChange={updateField}
              maxLength={100}
            />

            <FormField
              label="Tax number"
              name="taxNumber"
              value={form.taxNumber}
              onChange={updateField}
              maxLength={100}
            />

            <label className="flex flex-col gap-2 md:col-span-2 xl:col-span-3">
              <span className="text-sm font-semibold text-slate-700">
                Notes
              </span>

              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                maxLength={1000}
                rows={4}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                name="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={updateField}
                className="h-4 w-4 rounded border-slate-300"
              />

              <span className="text-sm font-semibold text-slate-700">
                Active customer
              </span>
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? 'Saving...'
                  : editingCustomer
                    ? 'Update customer'
                    : 'Create customer'}
              </button>

              {editingCustomer && (
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Customer list
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {customers.length} customer
                {customers.length === 1 ? '' : 's'} found
              </p>
            </div>

            <div className="w-full md:max-w-sm">
              <label
                htmlFor="customer-search"
                className="sr-only"
              >
                Search customers
              </label>

              <input
                id="customer-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, number, email..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {isPageLoading ? (
            <div className="flex min-h-56 items-center justify-center p-8">
              <div className="flex items-center gap-3 text-slate-600">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                Loading customers...
              </div>
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-slate-800">
                No customers found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {search
                  ? 'Try another search term.'
                  : 'Create the first customer using the form above.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeader>Customer no.</TableHeader>
                    <TableHeader>Customer</TableHeader>
                    <TableHeader>Contact</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader alignRight>Actions</TableHeader>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <span className="font-semibold text-slate-900">
                          {customer.customerNo}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </div>

                        {customer.companyName && (
                          <div className="mt-1 text-xs text-slate-500">
                            {customer.companyName}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div>{customer.email ?? '—'}</div>

                        <div className="mt-1 text-xs text-slate-500">
                          {customer.phone ??
                            customer.mobile ??
                            'No telephone number'}
                        </div>
                      </TableCell>

                      <TableCell>
                        {[customer.city, customer.country]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </TableCell>

                      <TableCell>
                        <span
                          className={
                            customer.isActive
                              ? 'inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                              : 'inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600'
                          }
                        >
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>

                      <TableCell alignRight>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(customer)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCustomerToDelete(customer)
                            }
                            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {customerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-customer-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2
              id="delete-customer-title"
              className="text-xl font-bold text-slate-900"
            >
              Delete customer
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              Are you sure you want to delete{' '}
              <strong>
                {customerToDelete.firstName}{' '}
                {customerToDelete.lastName}
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? 'Deleting...' : 'Delete customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

type FormFieldProps = {
  label: string;
  name: keyof CustomerFormData;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
};

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  maxLength,
  placeholder,
}: FormFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
        className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function TableHeader({
  children,
  alignRight = false,
}: {
  children: React.ReactNode;
  alignRight?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 ${
        alignRight ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  alignRight = false,
}: {
  children: React.ReactNode;
  alignRight?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap px-6 py-4 text-sm text-slate-600 ${
        alignRight ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </td>
  );
}
