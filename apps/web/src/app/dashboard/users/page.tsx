'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

import { ErrorMessage } from '@/components/ui/error-message';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiFetch } from '@/lib/api';
import type { User } from '@/types/user';

type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  role: User['role'];
  password: string;
  confirmPassword: string;
  isActive: boolean;
};

const USER_ROLES: User['role'][] = [
  'ADMIN',
  'EMPLOYEE',
  'CUSTOMER',
];

const EMPTY_FORM: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'EMPLOYEE',
  password: '',
  confirmPassword: '',
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<UserFormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadUsers = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }

    setError('');

    try {
      const result = await apiFetch<User[]>('/users');
      setUsers(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load users',
      );
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  function openCreateUser(): void {
    setForm(EMPTY_FORM);
    setFormError('');
    setSuccessMessage('');
    setIsCreateOpen(true);
  }

  function closeCreateUser(): void {
    if (isSubmitting) {
      return;
    }

    setIsCreateOpen(false);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function updateField(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void {
    const { name, value } = event.target;

    if (
      event.target instanceof HTMLInputElement &&
      event.target.type === 'checkbox'
    ) {
      const checked = event.target.checked;

      setForm((current) => ({
        ...current,
        [name]: checked,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function validateForm(): string | null {
    if (!form.firstName.trim()) {
      return 'First name is required.';
    }

    if (!form.lastName.trim()) {
      return 'Last name is required.';
    }

    if (!form.email.trim()) {
      return 'Email is required.';
    }

    if (form.password.length < 12) {
      return 'Password must contain at least 12 characters.';
    }

    if (form.password !== form.confirmPassword) {
      return 'Password and confirmation do not match.';
    }

    return null;
  }

  async function handleCreateUser(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    setSuccessMessage('');

    try {
      await apiFetch<User>('/users', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password,
          isActive: form.isActive,
        }),
      });

      await loadUsers(false);

      setSuccessMessage(
        `User ${form.firstName.trim()} ${form.lastName.trim()} created successfully.`,
      );

      setIsCreateOpen(false);
      setForm(EMPTY_FORM);
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : 'The user could not be created.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Users
          </h1>

          <p className="mt-2 text-slate-600">
            Manage administrators, employees and customers.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateUser}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          + Create User
        </button>
      </div>

      {error ? (
        <div className="mt-6">
          <ErrorMessage message={error} />
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {successMessage}
        </div>
      ) : null}

      {!error ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Role
                  </th>

                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {user.firstName} {user.lastName}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {user.email}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {user.role}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {users.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                No users were found.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isCreateOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-user-title"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="create-user-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    Create User
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a new administrator, employee or customer
                    login account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateUser}
                  disabled={isSubmitting}
                  aria-label="Close create user form"
                  className="rounded-lg px-3 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ×
                </button>
              </div>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-6 p-6"
            >
              {formError ? (
                <ErrorMessage message={formError} />
              ) : null}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField
                  label="First name"
                  name="firstName"
                  value={form.firstName}
                  onChange={updateField}
                  required
                  autoComplete="given-name"
                />

                <FormField
                  label="Last name"
                  name="lastName"
                  value={form.lastName}
                  onChange={updateField}
                  required
                  autoComplete="family-name"
                />

                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={updateField}
                  required
                  autoComplete="email"
                  placeholder="user@example.com"
                />

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Role
                  </span>

                  <select
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {USER_ROLES.map((role) => (
                      <option
                        key={role}
                        value={role}
                      >
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={updateField}
                  required
                  minLength={12}
                  autoComplete="new-password"
                  helperText="Minimum 12 characters."
                />

                <FormField
                  label="Confirm password"
                  name="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={updateField}
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={updateField}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Active account
                  </span>

                  <span className="mt-1 block text-sm text-slate-500">
                    Active users can sign in. Clear this option to
                    create the account in an inactive state.
                  </span>
                </span>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCreateUser}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Creating User...'
                    : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type FormFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  placeholder?: string;
  helperText?: string;
};

function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  minLength,
  autoComplete,
  placeholder,
  helperText,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required ? ' *' : ''}
      </span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />

      {helperText ? (
        <span className="mt-1.5 block text-xs text-slate-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
}
