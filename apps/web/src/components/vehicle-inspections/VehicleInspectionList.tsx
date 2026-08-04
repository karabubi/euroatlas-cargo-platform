'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import VehicleInspectionCard from './VehicleInspectionCard';
import VehicleInspectionForm from './VehicleInspectionForm';

import {
  getVehicleInspections,
} from '@/lib/vehicle-inspections-api';
import type {
  VehicleInspection,
} from '@/types/vehicle-inspection';

type VehicleInspectionListProps = {
  vehicleId: string;
};

export default function VehicleInspectionList({
  vehicleId,
}: VehicleInspectionListProps) {
  const [inspections, setInspections] =
    useState<VehicleInspection[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadInspections = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage('');

      try {
        const response =
          await getVehicleInspections(
            vehicleId,
          );

        setInspections(response);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Vehicle inspections could not be loaded.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [vehicleId],
  );

  useEffect(() => {
    // Initial synchronization with inspection API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInspections();
  }, [loadInspections]);

  function handleCreated(
    inspection: VehicleInspection,
  ) {
    setInspections((current) => [
      inspection,
      ...current,
    ]);

    setShowCreateForm(false);
  }

  function handleChanged(
    inspection: VehicleInspection,
  ) {
    setInspections((current) =>
      current.map((item) =>
        item.id === inspection.id
          ? inspection
          : item,
      ),
    );
  }

  function handleDeleted(
    inspectionId: string,
  ) {
    setInspections((current) =>
      current.filter(
        (item) =>
          item.id !== inspectionId,
      ),
    );
  }

  const completedCount =
    inspections.filter(
      (inspection) =>
        inspection.status === 'COMPLETED',
    ).length;

  const damageCount = inspections.reduce(
    (total, inspection) =>
      total +
      inspection.damageReports.length,
    0,
  );

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Vehicle inspections
          </h2>

          <p className="mt-2 text-slate-600">
            Record receiving, loading,
            arrival, customs and delivery
            inspections.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() =>
              void loadInspections(true)
            }
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <button
            type="button"
            onClick={() =>
              setShowCreateForm(true)
            }
            className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            New Inspection
          </button>
        </div>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-400">
            Total inspections
          </p>
          <p className="mt-2 text-3xl font-bold">
            {inspections.length}
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 p-5">
          <p className="text-sm text-emerald-700">
            Completed
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">
            {completedCount}
          </p>
        </div>

        <div className="rounded-2xl bg-red-50 p-5">
          <p className="text-sm text-red-700">
            Damage reports
          </p>
          <p className="mt-2 text-3xl font-bold text-red-900">
            {damageCount}
          </p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {showCreateForm ? (
        <div className="mt-8">
          <VehicleInspectionForm
            vehicleId={vehicleId}
            onCancel={() =>
              setShowCreateForm(false)
            }
            onSaved={handleCreated}
          />
        </div>
      ) : null}

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-slate-600">
            Loading vehicle inspections...
          </div>
        ) : inspections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-slate-900">
              No inspections recorded
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Create the first inspection for
              this vehicle.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {inspections.map(
              (inspection) => (
                <VehicleInspectionCard
                  key={inspection.id}
                  inspection={inspection}
                  onChanged={handleChanged}
                  onDeleted={handleDeleted}
                />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}
