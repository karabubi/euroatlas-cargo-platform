'use client';

import { useState } from 'react';

import { deleteDamageReport } from '@/lib/vehicle-inspections-api';
import type {
  VehicleDamageReport,
} from '@/types/vehicle-inspection';
import {
  formatInspectionValue,
} from '@/types/vehicle-inspection';

type DamageReportCardProps = {
  report: VehicleDamageReport;
  onDeleted: (reportId: string) => void;
  onEdit: (report: VehicleDamageReport) => void;
};

function formatMoney(
  value: string | number | null,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '—';
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function severityClass(
  severity: VehicleDamageReport['severity'],
): string {
  switch (severity) {
    case 'MINOR':
      return 'bg-amber-50 text-amber-700 ring-amber-200';

    case 'MODERATE':
      return 'bg-orange-50 text-orange-700 ring-orange-200';

    case 'MAJOR':
      return 'bg-red-50 text-red-700 ring-red-200';

    case 'TOTAL_LOSS':
      return 'bg-slate-950 text-white ring-slate-950';

    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200';
  }
}

export default function DamageReportCard({
  report,
  onDeleted,
  onEdit,
}: DamageReportCardProps) {
  const [isDeleting, setIsDeleting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete damage report "${report.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage('');

    try {
      await deleteDamageReport(report.id);
      onDeleted(report.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The damage report could not be deleted.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <article className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${severityClass(
                report.severity,
              )}`}
            >
              {formatInspectionValue(
                report.severity,
              )}
            </span>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {formatInspectionValue(report.area)}
            </span>

            {report.repaired ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                Repaired
              </span>
            ) : null}
          </div>

          <h4 className="mt-3 text-lg font-bold text-slate-950">
            {report.title}
          </h4>

          <p className="mt-2 text-sm text-slate-600">
            {report.description ||
              'No damage description provided.'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(report)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Edit
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-red-100 pt-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Estimated cost
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {formatMoney(report.estimatedCost)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Requires repair
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {report.requiresRepair ? 'Yes' : 'No'}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Repair status
          </dt>
          <dd className="mt-1 font-semibold text-slate-900">
            {report.repaired
              ? 'Completed'
              : 'Not repaired'}
          </dd>
        </div>
      </dl>

      {report.repairNotes ? (
        <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            Repair notes:
          </span>{' '}
          {report.repairNotes}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-white p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </article>
  );
}
