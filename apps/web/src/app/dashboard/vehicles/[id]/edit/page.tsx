'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import VehicleForm from '@/components/vehicles/VehicleForm';
import { ApiError } from '@/lib/api';
import {
  getVehicle,
  updateVehicle,
} from '@/lib/vehicles-api';
import type {
  CreateVehicleInput,
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

function optionalNumber(
  value: string | number | null | undefined,
): number | undefined {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue)
    ? undefined
    : numberValue;
}

export default function EditVehiclePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const vehicleId =
    typeof params.id === 'string'
      ? params.id
      : params.id?.[0];

  const [vehicle, setVehicle] =
    useState<Vehicle | null>(null);

  const [status, setStatus] =
    useState<VehicleStatus>('REGISTERED');

  const [isActive, setIsActive] =
    useState(true);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadVehicle = useCallback(async () => {
    if (!vehicleId) {
      setErrorMessage('Vehicle ID is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getVehicle(vehicleId);

      setVehicle(data);
      setStatus(data.status);
      setIsActive(data.isActive);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          'The vehicle could not be loaded.',
        );
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

  async function handleUpdateVehicle(
    input: CreateVehicleInput,
  ): Promise<void> {
    if (!vehicleId) {
      throw new Error('Vehicle ID is missing.');
    }

    const updatedVehicle = await updateVehicle(
      vehicleId,
      {
        ...input,
        status,
        isActive,
      },
    );

    router.push(
      `/dashboard/vehicles/${updatedVehicle.id}`,
    );
    router.refresh();
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-slate-600">
              Loading vehicle...
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (errorMessage || !vehicle) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-slate-950">
              Edit Vehicle
            </h1>

            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {errorMessage ||
                'Vehicle not found.'}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => void loadVehicle()}
                className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
              >
                Try Again
              </button>

              <Link
                href="/dashboard/vehicles"
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Back to Vehicles
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const initialValues: Partial<CreateVehicleInput> = {
    shipmentId: vehicle.shipmentId,
    vin: vehicle.vin ?? undefined,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year ?? undefined,
    color: vehicle.color ?? undefined,
    vehicleType:
      vehicle.vehicleType ?? undefined,
    fuelType: vehicle.fuelType ?? undefined,
    transmission:
      vehicle.transmission ?? undefined,
    purchasePrice: optionalNumber(
      vehicle.purchasePrice,
    ),
    declaredValue: optionalNumber(
      vehicle.declaredValue,
    ),
    hasKeys: vehicle.hasKeys,
    isRunning: vehicle.isRunning,
    hasDamage: vehicle.hasDamage,
    damageDescription:
      vehicle.damageDescription ?? undefined,
    notes: vehicle.notes ?? undefined,
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600">
              Vehicle Management
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-950">
              Edit {vehicle.vehicleNo}
            </h1>

            <p className="mt-2 text-slate-600">
              Update the vehicle, shipment,
              financial and condition information.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/vehicles/${vehicle.id}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>

            <Link
              href="/dashboard/vehicles"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-100"
            >
              All Vehicles
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            Status and availability
          </h2>

          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Vehicle status
              </span>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as VehicleStatus,
                  )
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                {vehicleStatuses.map(
                  (vehicleStatus) => (
                    <option
                      key={vehicleStatus}
                      value={vehicleStatus}
                    >
                      {formatStatus(vehicleStatus)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 md:mt-7">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) =>
                  setIsActive(
                    event.target.checked,
                  )
                }
                className="h-4 w-4"
              />

              <span>
                <span className="block font-medium text-slate-800">
                  Active vehicle
                </span>

                <span className="block text-sm text-slate-500">
                  Inactive vehicles remain stored but
                  are excluded from normal operations.
                </span>
              </span>
            </label>
          </div>
        </section>

        <VehicleForm
          key={vehicle.id}
          initialValues={initialValues}
          submitLabel="Save Changes"
          onSubmit={handleUpdateVehicle}
        />
      </div>
    </main>
  );
}
