'use client';

import {
  FormEvent,
  useState,
} from 'react';

import {
  createVehicleInspection,
  updateVehicleInspection,
} from '@/lib/vehicle-inspections-api';
import type {
  CreateVehicleInspectionInput,
  VehicleInspection,
} from '@/types/vehicle-inspection';
import {
  inspectionConditionOptions,
  inspectionStatusOptions,
  inspectionTypeOptions,
} from '@/types/vehicle-inspection';

type VehicleInspectionFormProps = {
  vehicleId: string;
  inspection?: VehicleInspection | null;
  onSaved: (
    inspection: VehicleInspection,
  ) => void;
  onCancel: () => void;
};

function toDateTimeLocal(
  value: string | undefined,
): string {
  const date = value
    ? new Date(value)
    : new Date();

  const offset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - offset,
  )
    .toISOString()
    .slice(0, 16);
}

export default function VehicleInspectionForm({
  vehicleId,
  inspection,
  onSaved,
  onCancel,
}: VehicleInspectionFormProps) {
  const [type, setType] = useState<
    CreateVehicleInspectionInput['type']
  >(inspection?.type ?? 'GENERAL');

  const [status, setStatus] = useState<
    NonNullable<
      CreateVehicleInspectionInput['status']
    >
  >(inspection?.status ?? 'DRAFT');

  const [condition, setCondition] =
    useState<
      NonNullable<
        CreateVehicleInspectionInput['condition']
      >
    >(inspection?.condition ?? 'GOOD');

  const [inspectionDate, setInspectionDate] =
    useState(
      toDateTimeLocal(
        inspection?.inspectionDate,
      ),
    );

  const [location, setLocation] = useState(
    inspection?.location ?? '',
  );

  const [inspectorName, setInspectorName] =
    useState(
      inspection?.inspectorName ?? '',
    );

  const [odometer, setOdometer] = useState(
    inspection?.odometer === null ||
      inspection?.odometer === undefined
      ? ''
      : String(inspection.odometer),
  );

  const [fuelLevel, setFuelLevel] =
    useState(
      inspection?.fuelLevel === null ||
        inspection?.fuelLevel === undefined
        ? ''
        : String(inspection.fuelLevel),
    );

  const [hasKeys, setHasKeys] = useState(
    inspection?.hasKeys ?? true,
  );

  const [isRunning, setIsRunning] =
    useState(
      inspection?.isRunning ?? true,
    );

  const [
    hasVisibleDamage,
    setHasVisibleDamage,
  ] = useState(
    inspection?.hasVisibleDamage ?? false,
  );

  const [summary, setSummary] = useState(
    inspection?.summary ?? '',
  );

  const [notes, setNotes] = useState(
    inspection?.notes ?? '',
  );

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedOdometer =
      odometer.trim() === ''
        ? undefined
        : Number(odometer);

    const parsedFuelLevel =
      fuelLevel.trim() === ''
        ? undefined
        : Number(fuelLevel);

    if (
      parsedOdometer !== undefined &&
      (
        !Number.isInteger(parsedOdometer) ||
        parsedOdometer < 0
      )
    ) {
      setErrorMessage(
        'Odometer must be a whole number of zero or greater.',
      );
      return;
    }

    if (
      parsedFuelLevel !== undefined &&
      (
        !Number.isInteger(parsedFuelLevel) ||
        parsedFuelLevel < 0 ||
        parsedFuelLevel > 100
      )
    ) {
      setErrorMessage(
        'Fuel level must be between 0 and 100.',
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const input: CreateVehicleInspectionInput = {
      vehicleId,
      type,
      status,
      condition,
      inspectionDate: new Date(
        inspectionDate,
      ).toISOString(),
      location: location.trim() || undefined,
      inspectorName:
        inspectorName.trim() || undefined,
      odometer: parsedOdometer,
      fuelLevel: parsedFuelLevel,
      hasKeys,
      isRunning,
      hasVisibleDamage,
      summary: summary.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      const savedInspection = inspection
        ? await updateVehicleInspection(
            inspection.id,
            input,
          )
        : await createVehicleInspection(
            input,
          );

      onSaved(savedInspection);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The vehicle inspection could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-sky-200 bg-sky-50/50 p-6"
    >
      <h3 className="text-xl font-bold text-slate-950">
        {inspection
          ? `Edit ${inspection.inspectionNo}`
          : 'Create vehicle inspection'}
      </h3>

      <p className="mt-2 text-sm text-slate-600">
        Record the vehicle condition,
        operational state and inspection details.
      </p>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <label>
          <span className="text-sm font-semibold text-slate-700">
            Inspection type
          </span>

          <select
            value={type}
            onChange={(event) =>
              setType(
                event.target
                  .value as CreateVehicleInspectionInput['type'],
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            {inspectionTypeOptions.map(
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

        <label>
          <span className="text-sm font-semibold text-slate-700">
            Status
          </span>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target
                  .value as typeof status,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            {inspectionStatusOptions.map(
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

        <label>
          <span className="text-sm font-semibold text-slate-700">
            Condition
          </span>

          <select
            value={condition}
            onChange={(event) =>
              setCondition(
                event.target
                  .value as typeof condition,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            {inspectionConditionOptions.map(
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

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label>
          <span className="text-sm font-semibold text-slate-700">
            Inspection date
          </span>

          <input
            type="datetime-local"
            value={inspectionDate}
            onChange={(event) =>
              setInspectionDate(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-700">
            Location
          </span>

          <input
            type="text"
            maxLength={200}
            value={location}
            onChange={(event) =>
              setLocation(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <label>
          <span className="text-sm font-semibold text-slate-700">
            Inspector
          </span>

          <input
            type="text"
            maxLength={150}
            value={inspectorName}
            onChange={(event) =>
              setInspectorName(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-700">
            Odometer
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={odometer}
            onChange={(event) =>
              setOdometer(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>

        <label>
          <span className="text-sm font-semibold text-slate-700">
            Fuel level (%)
          </span>

          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={fuelLevel}
            onChange={(event) =>
              setFuelLevel(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          {
            label: 'Vehicle has keys',
            value: hasKeys,
            setter: setHasKeys,
          },
          {
            label: 'Vehicle is running',
            value: isRunning,
            setter: setIsRunning,
          },
          {
            label: 'Visible damage',
            value: hasVisibleDamage,
            setter: setHasVisibleDamage,
          },
        ].map((item) => (
          <label
            key={item.label}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <input
              type="checkbox"
              checked={item.value}
              onChange={(event) =>
                item.setter(
                  event.target.checked,
                )
              }
            />

            <span className="font-semibold text-slate-800">
              {item.label}
            </span>
          </label>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-700">
          Summary
        </span>

        <textarea
          rows={3}
          maxLength={2000}
          value={summary}
          onChange={(event) =>
            setSummary(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        />
      </label>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-700">
          Notes
        </span>

        <textarea
          rows={4}
          maxLength={5000}
          value={notes}
          onChange={(event) =>
            setNotes(event.target.value)
          }
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
        />
      </label>

      <div className="mt-6 flex justify-end gap-3 border-t border-sky-100 pt-5">
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
          className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isSaving
            ? 'Saving...'
            : inspection
              ? 'Save Changes'
              : 'Create Inspection'}
        </button>
      </div>
    </form>
  );
}
