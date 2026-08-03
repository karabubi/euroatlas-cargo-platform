'use client';

import {
  type ReactNode,
  useEffect,
  useState,
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

export function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const user = getStoredUser();

    if (!token || !user) {
      router.replace('/login');
      return;
    }

    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <LoadingSpinner text="Checking authentication..." />
    );
  }

  return <>{children}</>;
}