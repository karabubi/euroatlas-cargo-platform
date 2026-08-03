'use client';

import {
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import {
  clearAuthentication,
  getStoredUser,
} from '@/lib/auth-storage';
import type { AuthUser } from '@/types/auth';

export function DashboardHeader() {
  const router = useRouter();
  const [user, setUser] =
    useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  function handleLogout(): void {
    clearAuthentication();
    router.replace('/login');
  }

  return (
    <header className="flex min-h-20 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h2 className="font-semibold text-slate-900">
          Cargo Management
        </h2>

        <p className="text-sm text-slate-500">
          Welcome to your administration panel
        </p>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </p>

            <p className="text-xs text-slate-500">
              {user.role}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Logout
        </button>
      </div>
    </header>
  );
}