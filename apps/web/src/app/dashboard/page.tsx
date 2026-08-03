'use client';

import { useCallback, useEffect, useState } from 'react';

import { QuickActions } from '@/components/dashboard/QuickActions';
import { ShipmentStatusList } from '@/components/dashboard/ShipmentStatusList';
import { StatCard } from '@/components/dashboard/StatCard';
import { apiFetch } from '@/lib/api';

type DashboardTotals = {
  customers: number;
  shipments: number;
  vehicles: number;
  activeShipments: number;
};

type ShipmentStatus = {
  status: string;
  total: number;
};

type DashboardStats = {
  totals: DashboardTotals;
  shipmentStatuses: ShipmentStatus[];
  generatedAt: string;
};

const emptyStats: DashboardStats = {
  totals: {
    customers: 0,
    shipments: 0,
    vehicles: 0,
    activeShipments: 0,
  },
  shipmentStatuses: [],
  generatedAt: '',
};

function formatGeneratedAt(value: string) {
  if (!value) {
    return 'Not loaded yet';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>(emptyStats);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const loadStats = useCallback(
    async (manualRefresh = false) => {
      if (manualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError('');

      try {
        const response =
          await apiFetch<DashboardStats>(
            '/dashboard/stats',
          );

        setStats(response);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Dashboard statistics could not be loaded.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStats();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStats]);

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />

          <div>
            <p className="font-bold text-slate-900">
              Loading dashboard
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Reading the latest business statistics.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            EuroAtlas Cargo
          </p>

          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            Operations dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-slate-600">
            Monitor customers, shipments and vehicles
            from one central workspace.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <p className="text-sm text-slate-500">
            Updated:{' '}
            <span className="font-semibold text-slate-700">
              {formatGeneratedAt(stats.generatedAt)}
            </span>
          </p>

          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => {
              void loadStats(true);
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </header>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="font-bold text-red-800">
            Dashboard error
          </p>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              void loadStats(true);
            }}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </section>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Customers"
          value={stats.totals.customers}
          description="Registered cargo customers"
          icon="👥"
        />

        <StatCard
          title="Shipments"
          value={stats.totals.shipments}
          description="Total shipment records"
          icon="📦"
        />

        <StatCard
          title="Vehicles"
          value={stats.totals.vehicles}
          description="Vehicles registered in the fleet"
          icon="🚚"
        />

        <StatCard
          title="Active shipments"
          value={stats.totals.activeShipments}
          description="Currently active shipment records"
          icon="🌍"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-sky-600">
            Common tasks
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Quick actions
          </h2>
        </div>

        <div className="mt-6">
          <QuickActions />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-wider text-sky-600">
              Shipment activity
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Status distribution
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Shipment records grouped by their current
              operational status.
            </p>
          </div>

          <ShipmentStatusList
            statuses={stats.shipmentStatuses}
            totalShipments={stats.totals.shipments}
          />
        </article>

        <article className="rounded-2xl bg-slate-950 p-7 text-white shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-sky-300">
            System overview
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Cargo operations
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            EuroAtlas Cargo now provides live statistics
            directly from PostgreSQL through the NestJS
            API.
          </p>

          <div className="mt-8 space-y-4">
            <OverviewRow
              label="API status"
              value="Connected"
            />

            <OverviewRow
              label="Database"
              value="PostgreSQL"
            />

            <OverviewRow
              label="Backend"
              value="NestJS"
            />

            <OverviewRow
              label="Frontend"
              value="Next.js"
            />
          </div>
        </article>
      </section>
    </div>
  );
}

type OverviewRowProps = {
  label: string;
  value: string;
};

function OverviewRow({
  label,
  value,
}: OverviewRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4 last:border-0">
      <span className="text-sm text-slate-400">
        {label}
      </span>

      <span className="text-sm font-bold text-white">
        {value}
      </span>
    </div>
  );
}
