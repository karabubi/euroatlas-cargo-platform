'use client';

import { useState } from 'react';

import DamageReportCard from './DamageReportCard';
import DamageReportForm from './DamageReportForm';
import VehicleInspectionForm from './VehicleInspectionForm';

import {
  deleteVehicleInspection,
} from '@/lib/vehicle-inspections-api';
import type {
  VehicleDamageReport,
  VehicleInspection,
} from '@/types/vehicle-inspection';
import {
  formatInspectionValue,
} from '@/types/vehicle-inspection';

type VehicleInspectionCardProps = {
  inspection: VehicleInspection;
  onChanged: (
    inspection: VehicleInspection,
  ) => void;
  onDeleted: (inspectionId: string) => void;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function statusClass(
  status: VehicleInspection['status'],
): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';

    case 'IN_PROGRESS':
      return 'bg-sky-50 text-sky-700 ring-sky-200';

    case 'CANCELLED':
      return 'bg-red-50 text-red-700 ring-red-200';

    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

function conditionClass(
  condition: VehicleInspection['condition'],
): string {
  switch (condition) {
    case 'EXCELLENT':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';

    case 'GOOD':
      return 'bg-sky-50 text-sky-700 ring-sky-200';

    case 'FAIR':
      return 'bg-amber-50 text-amber-700 ring-amber-200';

    case 'POOR':
    case 'DAMAGED':
      return 'bg-red-50 text-red-700 ring-red-200';

    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

export default function VehicleInspectionCard({
  inspection,
  onChanged,
  onDeleted,
}: VehicleInspectionCardProps) {
  const [isExpanded, setIsExpanded] =
    useState(true);

  const [isEditing, setIsEditing] =
    useState(false);

  const [isAddingDamage, setIsAddingDamage] =
    useState(false);

  const [
    editingDamageReport,
    setEditingDamageReport,
  ] = useState<VehicleDamageReport | null>(
    null,
  );

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete inspection ${inspection.inspectionNo}? All connected damage reports will also be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');

    try {
      await deleteVehicleInspection(
        inspection.id,
      );

      onDeleted(inspection.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The inspection could not be deleted.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDamageSaved(
    report: VehicleDamageReport,
  ) {
    const exists =
      inspection.damageReports.some(
        (currentReport) =>
          currentReport.id === report.id,
      );

    const damageReports = exists
      ? inspection.damageReports.map(
          (currentReport) =>
            currentReport.id === report.id
              ? report
              : currentReport,
        )
      : [
          report,
          ...inspection.damageReports,
        ];

    onChanged({
      ...inspection,
      hasVisibleDamage:
        damageReports.length > 0,
      damageReports,
      _count: {
        damageReports:
          damageReports.length,
      },
    });

    setIsAddingDamage(false);
    setEditingDamageReport(null);
  }

  function handleDamageDeleted(
    reportId: string,
  ) {
    const damageReports =
      inspection.damageReports.filter(
        (report) => report.id !== reportId,
      );

    onChanged({
      ...inspection,
      hasVisibleDamage:
        damageReports.length > 0,
      damageReports,
      _count: {
        damageReports:
          damageReports.length,
      },
    });
  }

  if (isEditing) {
    return (
      <VehicleInspectionForm
        vehicleId={inspection.vehicleId}
        inspection={inspection}
        onCancel={() => setIsEditing(false)}
        onSaved={(updatedInspection) => {
          onChanged({
            ...updatedInspection,
            damageReports:
              updatedInspection.damageReports ??
              inspection.damageReports,
          });

          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {inspection.inspectionNo}
              </span>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${statusClass(
                  inspection.status,
                )}`}
              >
                {formatInspectionValue(
                  inspection.status,
                )}
              </span>

              {inspection.condition ? (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${conditionClass(
                    inspection.condition,
                  )}`}
                >
                  {formatInspectionValue(
                    inspection.condition,
                  )}
                </span>
              ) : null}

              {inspection.hasVisibleDamage ? (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
                  Visible damage
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 text-2xl font-bold text-slate-950">
              {formatInspectionValue(
                inspection.type,
              )}{' '}
              inspection
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {formatDate(
                inspection.inspectionDate,
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setIsExpanded(
                  (current) => !current,
                )
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              {isExpanded
                ? 'Collapse'
                : 'Expand'}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {isDeleting
                ? 'Deleting...'
                : 'Delete'}
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </header>

      {isExpanded ? (
        <div className="p-6">
          <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Inspector
              </dt>
              <dd className="mt-2 font-semibold text-slate-900">
                {inspection.inspectorName ||
                  '—'}
              </dd>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Location
              </dt>
              <dd className="mt-2 font-semibold text-slate-900">
                {inspection.location || '—'}
              </dd>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Odometer
              </dt>
              <dd className="mt-2 font-semibold text-slate-900">
                {inspection.odometer !== null
                  ? `${inspection.odometer.toLocaleString()} km`
                  : '—'}
              </dd>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Fuel level
              </dt>
              <dd className="mt-2 font-semibold text-slate-900">
                {inspection.fuelLevel !== null
                  ? `${inspection.fuelLevel}%`
                  : '—'}
              </dd>
            </div>
          </dl>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-sm text-slate-500">
                Keys available
              </dt>
              <dd className="mt-1 font-bold text-slate-900">
                {inspection.hasKeys === null
                  ? 'Unknown'
                  : inspection.hasKeys
                    ? 'Yes'
                    : 'No'}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-sm text-slate-500">
                Vehicle running
              </dt>
              <dd className="mt-1 font-bold text-slate-900">
                {inspection.isRunning === null
                  ? 'Unknown'
                  : inspection.isRunning
                    ? 'Yes'
                    : 'No'}
              </dd>
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-sm text-slate-500">
                Damage reports
              </dt>
              <dd className="mt-1 font-bold text-slate-900">
                {
                  inspection.damageReports
                    .length
                }
              </dd>
            </div>
          </dl>

          {inspection.summary ? (
            <section className="mt-6 rounded-2xl border border-slate-200 p-5">
              <h4 className="font-bold text-slate-950">
                Inspection summary
              </h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {inspection.summary}
              </p>
            </section>
          ) : null}

          {inspection.notes ? (
            <section className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
              <h4 className="font-bold">
                Internal notes
              </h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                {inspection.notes}
              </p>
            </section>
          ) : null}

          <section className="mt-8 border-t border-slate-200 pt-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h4 className="text-xl font-bold text-slate-950">
                  Damage reports
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    inspection.damageReports
                      .length
                  }{' '}
                  recorded damage{' '}
                  {inspection.damageReports
                    .length === 1
                    ? 'item'
                    : 'items'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingDamageReport(null);
                  setIsAddingDamage(true);
                }}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                Add Damage Report
              </button>
            </div>

            {isAddingDamage ? (
              <div className="mt-6">
                <DamageReportForm
                  inspectionId={inspection.id}
                  onCancel={() =>
                    setIsAddingDamage(false)
                  }
                  onSaved={handleDamageSaved}
                />
              </div>
            ) : null}

            {editingDamageReport ? (
              <div className="mt-6">
                <DamageReportForm
                  inspectionId={inspection.id}
                  report={editingDamageReport}
                  onCancel={() =>
                    setEditingDamageReport(
                      null,
                    )
                  }
                  onSaved={handleDamageSaved}
                />
              </div>
            ) : null}

            {inspection.damageReports.length >
            0 ? (
              <div className="mt-6 grid gap-4">
                {inspection.damageReports.map(
                  (report) => (
                    <DamageReportCard
                      key={report.id}
                      report={report}
                      onEdit={(selectedReport) => {
                        setIsAddingDamage(false);
                        setEditingDamageReport(
                          selectedReport,
                        );
                      }}
                      onDeleted={
                        handleDamageDeleted
                      }
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="font-semibold text-slate-900">
                  No damage reports recorded
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Add a report when visible
                  damage is found.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </article>
  );
}
