'use client';

import {
  type ReactNode,
  useEffect,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/navigation';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  getAccessToken,
  getStoredUser,
} from '@/lib/auth-storage';

interface AuthGuardProps {
  children: ReactNode;
}

function subscribe(): () => void {
  return () => {};
}

function getAuthenticationSnapshot(): boolean {
  return Boolean(getAccessToken() && getStoredUser());
}

function getServerSnapshot(): boolean {
  return false;
}

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();

  const authenticated = useSyncExternalStore(
    subscribe,
    getAuthenticationSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!authenticated) {
      router.replace('/login');
    }
  }, [authenticated, router]);

  if (!authenticated) {
    return (
      <LoadingSpinner text="Checking authentication..." />
    );
  }

  return <>{children}</>;
}