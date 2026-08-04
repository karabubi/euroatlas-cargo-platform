'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  createDamageReport,
  updateDamageReport,
} from '@/lib/vehicle-inspections-api';
import type {
  CreateDamageReportInput,
  VehicleDamageReport,
} from '@/types/vehicle-inspection';
import {
  damageAreaOptions,
  damageSeverityOptions,
} from '@/types/vehicle-inspection';

type DamageReportFormProps = {
  inspectionId: string;
  report?: VehicleDamageReport | null;
  onSaved: (report: VehicleDamageReport) => void;
  onCancel: () => void;
};

export default function DamageReportForm({
  inspectionId,
  report,
  onSaved,
  onCancel,
}: DamageReportFormProps) {
  const [area, setArea] = useState<
    CreateDamageReportInput['area']
  >(report?.area ?? 'OTHER');

  const [severity, setSeverity] = useState<
    CreateDamageReportInput['severity']
  >(report?.severity ?? 'MINOR');

  const [title, setTitle] = useState(
    report?.title ?? '',
  );

  const [description, setDescription] =
    useState(report?.description ?? '');

  const [estimatedCost, setEstimatedCost] =
    useState(
      report?.estimatedCost === null ||
        report?.estimatedCost === undefined
        ? ''
        : String(report.estimatedCost),
    );

  const [requiresRepair, setRequiresRepair] =
    useState(report?.requiresRepair ?? true);

  const [repaired, setRepaired] = useState(
    report?.repaired ?? false,
  );

  const [repairNotes, setRepairNotes] =
    useState(report?.repairNotes ?? '');

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage(
        'Please enter a damage report title.',
      );
      return;
    }

    const parsedEstimatedCost =
      estimatedCost.trim() === ''
        ? undefined
        : Number(estimatedCost);

    if (
      parsedEstimatedCost !== undefined &&
      (
        Number.isNaN(parsedEstimatedCost) ||
        parsedEstimatedCost < 0
      )
    ) {
      setErrorMessage(
        'Estimated cost must be zero or greater.',
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const input: CreateDamageReportInput = {
      area,
      severity,
      title: title.trim(),
      description:
        description.trim() || undefined,
      estimatedCost: parsedEstimatedCost,
      requiresRepair,
      repaired,
      repairNotes:
        repairNotes.trim() || undefined,
    };

    try {
      const savedReport = report
        ? await updateDamageReport(
            report.id,
            input,
          )
        : await createDamageReport(
            inspectionId,
            input,
          );

      onSaved(savedReport);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The damage report could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-red-200 bg-red-50/50 p-6"
    >
      <div>
        <h4 className="text-xl font-bold text-slate-950">
          {report
            ? 'Edit damage report'
            : 'Add damage report'}
        </h4>

        <p className="mt-2 text-sm text-slate-600">
          Record the damaged area, severity,
          estimated repair cost and repair status.
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-white p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <label>
          <span className="block text-sm font-semibold text-slate-700">
            Damage area
          </span>

          <select
            value={area}
            onChange={(event) =>
              setArea(
                event.target
                  .value as CreateDamageReportInput['area'],
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            {damageAreaOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="block text-sm font-semibold text-slate-700">
            Severity
          </span>

          <select
            value={severity}
            onChange={(event) =>
              setSeverity(
                event.target
                  .value as CreateDamageReportInput['severity'],
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            {damageSeverityOptions.map(
              (option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      <label className="mt-5 block">
        <span className="block text-sm font-semibold text-slate-700">
          Title
        </span>

        <input
          type="text"
          maxLength={200}
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Example: Rear bumper scratch"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        />
      </label>

      <label className="mt-5 block">
        <span className="block text-sm font-semibold text-slate-700">
          Description
        </span>

        <textarea
          rows={4}
          maxLength={3000}
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        />
      </label>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label>
          <span className="block text-sm font-semibold text-slate-700">
            Estimated cost (€)
          </span>

          <input
            type="number"
            min="0"
            step="0.01"
            value={estimatedCost}
            onChange={(event) =>
              setEstimatedCost(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>

        <div className="grid gap-3">
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={requiresRepair}
              onChange={(event) =>
                setRequiresRepair(
                  event.target.checked,
                )
              }
            />

            <span className="font-semibold text-slate-800">
              Requires repair
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={repaired}
              onChange={(event) =>
                setRepaired(
                  event.target.checked,
                )
              }
            />

            <span className="font-semibold text-slate-800">
              Repair completed
            </span>
          </label>
        </div>
      </div>

      <label className="mt-5 block">
        <span className="block text-sm font-semibold text-slate-700">
          Repair notes
        </span>

        <textarea
          rows={3}
          maxLength={3000}
          value={repairNotes}
          onChange={(event) =>
            setRepairNotes(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        />
      </label>

      <div className="mt-6 flex justify-end gap-3 border-t border-red-100 pt-5">
        <button
          type="button"
          disabled={isSaving}
          onClick={onCancel}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isSaving
            ? 'Saving...'
            : report
              ? 'Save Changes'
              : 'Add Damage Report'}
        </button>
      </div>
    </form>
  );
}
