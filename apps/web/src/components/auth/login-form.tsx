'use client';

import {
  type FormEvent,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { ErrorMessage } from '@/components/ui/error-message';
import { apiRequest } from '@/lib/api';
import { saveAuthentication } from '@/lib/auth-storage';
import type {
  LoginRequest,
  LoginResponse,
} from '@/types/auth';

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState(
    'admin@euroatlascargo.com',
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError('');
    setIsSubmitting(true);

    const credentials: LoginRequest = {
      email: email.trim().toLowerCase(),
      password,
    };

    try {
      const response =
        await apiRequest<LoginResponse>(
          '/auth/login',
          {
            method: 'POST',
            body: JSON.stringify(credentials),
          },
        );

      saveAuthentication(
        response.accessToken,
        response.user,
      );

      router.replace('/dashboard');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Login failed',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
          minLength={8}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {error ? (
        <ErrorMessage message={error} />
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting
          ? 'Signing in...'
          : 'Sign in'}
      </button>
    </form>
  );
}