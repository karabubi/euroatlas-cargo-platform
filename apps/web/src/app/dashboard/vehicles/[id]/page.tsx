'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import VehiclePhotosPanel from '@/components/vehicle-photos/VehiclePhotosPanel';

import { ApiError, apiFetch } from '@/lib/api';

type VehicleStatus =
  | 'REGISTERED'
  | 'RECEIVED'
  | 'INSPECTED'
  | 'READY_FOR_LOADING'
  | 'LOADED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'CUSTOMS_CLEARANCE'
  | 'READY_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

type Vehicle = {
  id: string;
  vehicleNo: string;
  shipmentId: string;
  vin: string | null;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  vehicleType: string | null;
  fuelType: string | null;
  transmission: string | null;
  purchasePrice: string | number | null;
  declaredValue: string | number | null;
  hasKeys: boolean;
  isRunning: boolean;
  hasDamage: boolean;
  damageDescription: string | null;
  status: VehicleStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shipment: {
    id: string;
    shipmentNo: string;
    status: string;
    originCountry: string;
    destinationCountry: string;
    customer: {
      id: string;
      customerNo: string;
      companyName: string | null;
      firstName: string;
      lastName: string;
    };
  };
};

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: string | number | null): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-2 break-words text-base font-medium text-slate-900">
        {value || '—'}
      </dd>
    </div>
  );
}

export default function VehicleDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const vehicleId =
    typeof params.id === 'string' ? params.id : params.id?.[0];

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setError('Vehicle ID is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await apiFetch<Vehicle>(`/vehicles/${vehicleId}`);
      setVehicle(data);
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('The vehicle could not be loaded.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    // Initial synchronization with the vehicle API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadVehicle();
  }, [loadVehicle]);

  async function handleDelete() {
    if (!vehicle) {
      return;
    }

    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.vehicleNo}? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      await apiFetch(`/vehicles/${vehicle.id}`, {
        method: 'DELETE',
      });

      router.push('/dashboard/vehicles');
      router.refresh();
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(requestError.message);
      } else {
        setError('The vehicle could not be deleted.');
      }

      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl bg-white p-10 shadow-sm">
            <p className="text-lg font-medium text-slate-600">
              Loading vehicle details...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !vehicle) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-red-200 bg-white p-10 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-900">
              Vehicle Details
            </h1>

            <p className="mt-5 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void loadVehicle()}
                className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Try again
              </button>

              <Link
                href="/dashboard/vehicles"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to Vehicles
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!vehicle) {
    return null;
  }

  const customerName =
    vehicle.shipment.customer.companyName ||
    `${vehicle.shipment.customer.firstName} ${vehicle.shipment.customer.lastName}`;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
              Vehicle Management
            </p>

            <h1 className="mt-3 text-4xl font-bold text-slate-950">
              {vehicle.vehicleNo}
            </h1>

            <p className="mt-3 text-lg text-slate-600">
              {vehicle.make} {vehicle.model}
              {vehicle.year ? ` · ${vehicle.year}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/vehicles"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back to Vehicles
            </Link>

            <Link
              href={`/dashboard/vehicles/${vehicle.id}/edit`}
              className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              Edit Vehicle
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Status
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {formatStatus(vehicle.status)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Active
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {yesNo(vehicle.isActive)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Shipment
            </p>
            <Link
              href={`/dashboard/shipments/${vehicle.shipment.id}`}
              className="mt-3 block text-2xl font-bold text-sky-600 hover:text-sky-700"
            >
              {vehicle.shipment.shipmentNo}
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Condition
            </p>
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {vehicle.hasDamage ? 'With damage' : 'No damage'}
            </p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Vehicle information
          </h2>

          <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Vehicle number" value={vehicle.vehicleNo} />
            <DetailItem label="VIN" value={vehicle.vin || '—'} />
            <DetailItem label="Make" value={vehicle.make} />
            <DetailItem label="Model" value={vehicle.model} />
            <DetailItem label="Year" value={vehicle.year || '—'} />
            <DetailItem label="Color" value={vehicle.color || '—'} />
            <DetailItem
              label="Vehicle type"
              value={vehicle.vehicleType || '—'}
            />
            <DetailItem label="Fuel type" value={vehicle.fuelType || '—'} />
            <DetailItem
              label="Transmission"
              value={vehicle.transmission || '—'}
            />
          </dl>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Shipment information
            </h2>

            <dl className="mt-8 grid gap-y-8">
              <DetailItem
                label="Shipment number"
                value={
                  <Link
                    href={`/dashboard/shipments/${vehicle.shipment.id}`}
                    className="text-sky-600 hover:text-sky-700"
                  >
                    {vehicle.shipment.shipmentNo}
                  </Link>
                }
              />

              <DetailItem
                label="Shipment status"
                value={formatStatus(vehicle.shipment.status)}
              />

              <DetailItem label="Customer" value={customerName} />

              <DetailItem
                label="Customer number"
                value={vehicle.shipment.customer.customerNo}
              />

              <DetailItem
                label="Route"
                value={`${vehicle.shipment.originCountry} → ${vehicle.shipment.destinationCountry}`}
              />
            </dl>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Financial information
            </h2>

            <dl className="mt-8 grid gap-y-8">
              <DetailItem
                label="Purchase price"
                value={formatMoney(vehicle.purchasePrice)}
              />

              <DetailItem
                label="Declared value"
                value={formatMoney(vehicle.declaredValue)}
              />
            </dl>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Vehicle condition
          </h2>

          <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-3">
            <DetailItem label="Keys available" value={yesNo(vehicle.hasKeys)} />
            <DetailItem label="Vehicle running" value={yesNo(vehicle.isRunning)} />
            <DetailItem label="Has damage" value={yesNo(vehicle.hasDamage)} />
          </dl>

          {vehicle.hasDamage ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-700">
                Damage description
              </p>

              <p className="mt-2 whitespace-pre-wrap text-amber-950">
                {vehicle.damageDescription || 'No damage description provided.'}
              </p>
            </div>
          ) : null}
        </section>

        <VehiclePhotosPanel
          vehicleId={vehicle.id}
        />

        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">
            Notes
          </h2>

          <p className="mt-5 whitespace-pre-wrap text-slate-700">
            {vehicle.notes || 'No notes available.'}
          </p>
        </section>

        <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
          <h2 className="text-2xl font-bold">
            System information
          </h2>

          <dl className="mt-8 grid gap-x-10 gap-y-8 md:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Created
              </dt>
              <dd className="mt-2 font-medium">
                {formatDate(vehicle.createdAt)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Last updated
              </dt>
              <dd className="mt-2 font-medium">
                {formatDate(vehicle.updatedAt)}
              </dd>
            </div>

            <div className="md:col-span-2">
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Vehicle ID
              </dt>
              <dd className="mt-2 break-all font-mono text-sm">
                {vehicle.id}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
