'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ApiError } from '@/lib/api';
import { getVehicles } from '@/lib/vehicles-api';
import type {
  Vehicle,
  VehicleStatus,
} from '@/types/vehicle';

const vehicleStatuses: VehicleStatus[] = [
  'REGISTERED',
  'RECEIVED',
  'INSPECTED',
  'READY_FOR_LOADING',
  'LOADED',
  'IN_TRANSIT',
  'ARRIVED',
  'CUSTOMS_CLEARANCE',
  'READY_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

function formatStatus(status: VehicleStatus): string {
  return status
    .toLowerCase()
    .split('_')
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
}

function statusClasses(status: VehicleStatus): string {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800';

    case 'IN_TRANSIT':
    case 'LOADED':
      return 'bg-sky-100 text-sky-800';

    case 'ARRIVED':
    case 'CUSTOMS_CLEARANCE':
    case 'READY_FOR_DELIVERY':
      return 'bg-amber-100 text-amber-800';

    case 'CANCELLED':
      return 'bg-red-100 text-red-800';

    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState<VehicleStatus | ''>('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadVehicles = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        setErrorMessage('');

        const data = await getVehicles({
          search:
            search.trim() || undefined,
          status: status || undefined,
        });

        setVehicles(data);
      } catch (error) {
        if (error instanceof ApiError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(
            'Could not load vehicles.',
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, status],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVehicles();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadVehicles]);

  const statistics = useMemo(() => {
    const active = vehicles.filter(
      (vehicle) => vehicle.isActive,
    ).length;

    const inTransit = vehicles.filter(
      (vehicle) =>
        vehicle.status === 'IN_TRANSIT' ||
        vehicle.status === 'LOADED',
    ).length;

    const delivered = vehicles.filter(
      (vehicle) =>
        vehicle.status === 'DELIVERED',
    ).length;

    const damaged = vehicles.filter(
      (vehicle) => vehicle.hasDamage,
    ).length;

    return {
      total: vehicles.length,
      active,
      inTransit,
      delivered,
      damaged,
    };
  }, [vehicles]);

  function clearFilters(): void {
    setSearch('');
    setStatus('');
  }

  const hasFilters =
    search.trim().length > 0 ||
    status.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Vehicle management
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            Vehicles
          </h1>

          <p className="mt-2 text-slate-600">
            Manage vehicles connected to cargo shipments.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              void loadVehicles(true)
            }
            disabled={isRefreshing}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <Link
            href="/dashboard/vehicles/new"
            className="rounded-lg bg-slate-950 px-5 py-3 text-center font-semibold text-white hover:bg-slate-800"
          >
            Add Vehicle
          </Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Results"
          value={statistics.total}
        />

        <SummaryCard
          label="Active"
          value={statistics.active}
        />

        <SummaryCard
          label="In transit"
          value={statistics.inTransit}
        />

        <SummaryCard
          label="Delivered"
          value={statistics.delivered}
        />

        <SummaryCard
          label="With damage"
          value={statistics.damaged}
        />
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px_auto]">
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
              placeholder="Vehicle no., VIN, make, model or shipment..."
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label>
            <span className="text-sm font-semibold text-slate-700">
              Status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as
                    | VehicleStatus
                    | '',
                )
              }
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="">
                All statuses
              </option>

              {vehicleStatuses.map(
                (vehicleStatus) => (
                  <option
                    key={vehicleStatus}
                    value={vehicleStatus}
                  >
                    {formatStatus(
                      vehicleStatus,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {isLoading && (
        <section className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            Loading vehicles...
          </p>
        </section>
      )}

      {!isLoading && errorMessage && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>

          <button
            type="button"
            onClick={() =>
              void loadVehicles(true)
            }
            className="mt-4 rounded-lg bg-red-700 px-4 py-2.5 font-semibold text-white hover:bg-red-800"
          >
            Try Again
          </button>
        </section>
      )}

      {!isLoading &&
        !errorMessage &&
        vehicles.length === 0 && (
          <section className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              {hasFilters
                ? 'No matching vehicles'
                : 'No vehicles found'}
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              {hasFilters
                ? 'Change or clear the search filters to see other vehicles.'
                : 'Create the first vehicle and assign it to an active shipment.'}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}

              <Link
                href="/dashboard/vehicles/new"
                className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Add Vehicle
              </Link>
            </div>
          </section>
        )}

      {!isLoading &&
        !errorMessage &&
        vehicles.length > 0 && (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-950">
                Vehicle records
              </h2>

              <p className="mt-1 text-slate-600">
                {vehicles.length}{' '}
                {vehicles.length === 1
                  ? 'vehicle'
                  : 'vehicles'}{' '}
                found.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1050px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <TableHeading>
                      Vehicle No.
                    </TableHeading>

                    <TableHeading>
                      Vehicle
                    </TableHeading>

                    <TableHeading>
                      VIN
                    </TableHeading>

                    <TableHeading>
                      Shipment
                    </TableHeading>

                    <TableHeading>
                      Status
                    </TableHeading>

                    <TableHeading>
                      Condition
                    </TableHeading>

                    <TableHeading>
                      Active
                    </TableHeading>

                    <TableHeading alignRight>
                      Actions
                    </TableHeading>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <span className="font-semibold text-slate-950">
                          {vehicle.vehicleNo}
                        </span>
                      </TableCell>

                      <TableCell>
                        <p className="font-semibold text-slate-950">
                          {vehicle.make}{' '}
                          {vehicle.model}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            vehicle.year,
                            vehicle.color,
                            vehicle.vehicleType,
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </p>
                      </TableCell>

                      <TableCell>
                        {vehicle.vin || '—'}
                      </TableCell>

                      <TableCell>
                        {vehicle.shipment ? (
                          <Link
                            href={`/dashboard/shipments/${vehicle.shipment.id}`}
                            className="font-semibold text-sky-700 hover:text-sky-900"
                          >
                            {
                              vehicle.shipment
                                .shipmentNo
                            }
                          </Link>
                        ) : (
                          '—'
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            vehicle.status,
                          )}`}
                        >
                          {formatStatus(
                            vehicle.status,
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <p>
                            Keys:{' '}
                            {vehicle.hasKeys
                              ? 'Yes'
                              : 'No'}
                          </p>

                          <p>
                            Running:{' '}
                            {vehicle.isRunning
                              ? 'Yes'
                              : 'No'}
                          </p>

                          <p
                            className={
                              vehicle.hasDamage
                                ? 'font-semibold text-red-700'
                                : 'text-slate-500'
                            }
                          >
                            Damage:{' '}
                            {vehicle.hasDamage
                              ? 'Yes'
                              : 'No'}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span
                          className={
                            vehicle.isActive
                              ? 'font-semibold text-emerald-700'
                              : 'font-semibold text-slate-500'
                          }
                        >
                          {vehicle.isActive
                            ? 'Yes'
                            : 'No'}
                        </span>
                      </TableCell>

                      <TableCell alignRight>
                        <div className="flex justify-end gap-4">
                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}`}
                            className="font-semibold text-sky-700 hover:text-sky-900"
                          >
                            View
                          </Link>

                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}/edit`}
                            className="font-semibold text-slate-700 hover:text-slate-950"
                          >
                            Edit
                          </Link>
                        </div>
                      </TableCell>
                    </tr>
                  ))}
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
  value: number;
};

function SummaryCard({
  label,
  value,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

type TableContentProps = {
  children: React.ReactNode;
  alignRight?: boolean;
};

function TableHeading({
  children,
  alignRight = false,
}: TableContentProps) {
  return (
    <th
      className={`px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        alignRight
          ? 'text-right'
          : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  alignRight = false,
}: TableContentProps) {
  return (
    <td
      className={`px-6 py-4 text-sm text-slate-700 ${
        alignRight
          ? 'text-right'
          : 'text-left'
      }`}
    >
      {children}
    </td>
  );
}
