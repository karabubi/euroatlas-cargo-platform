'use client';

import { FormEvent, useState } from 'react';

import { updateVehiclePhoto } from '@/lib/vehicle-photos-api';
import type {
  VehiclePhoto,
  VehiclePhotoCategory,
} from '@/types/vehicle-photo';

type VehiclePhotoMetadataEditorProps = {
  photo: VehiclePhoto;
  onSaved: (photo: VehiclePhoto) => void;
  onCancel: () => void;
};

const PHOTO_CATEGORIES: {
  value: VehiclePhotoCategory;
  label: string;
}[] = [
  { value: 'FRONT', label: 'Front' },
  { value: 'REAR', label: 'Rear' },
  { value: 'LEFT_SIDE', label: 'Left side' },
  { value: 'RIGHT_SIDE', label: 'Right side' },
  { value: 'INTERIOR', label: 'Interior' },
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'VIN', label: 'VIN' },
  { value: 'ENGINE', label: 'Engine' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'OTHER', label: 'Other' },
];

export default function VehiclePhotoMetadataEditor({
  photo,
  onSaved,
  onCancel,
}: VehiclePhotoMetadataEditorProps) {
  const [category, setCategory] =
    useState<VehiclePhotoCategory>(photo.category);

  const [title, setTitle] = useState(
    photo.title ?? '',
  );

  const [description, setDescription] = useState(
    photo.description ?? '',
  );

  const [sortOrder, setSortOrder] = useState(
    String(photo.sortOrder),
  );

  const [isPrimary, setIsPrimary] = useState(
    photo.isPrimary,
  );

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage('');

    const parsedSortOrder = Number(sortOrder);

    if (
      !Number.isInteger(parsedSortOrder) ||
      parsedSortOrder < 0
    ) {
      setErrorMessage(
        'Sort order must be a whole number of zero or greater.',
      );
      setIsSaving(false);
      return;
    }

    try {
      const updatedPhoto = await updateVehiclePhoto(
        photo.id,
        {
          category,
          title: title.trim(),
          description: description.trim(),
          sortOrder: parsedSortOrder,
          isPrimary,
        },
      );

      onSaved(updatedPhoto);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The photo information could not be saved.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-sky-200 bg-sky-50 p-5"
    >
      <div>
        <h4 className="text-lg font-bold text-slate-950">
          Edit photo information
        </h4>

        <p className="mt-1 text-sm text-slate-600">
          Update the photo title, description,
          category and display order.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Photo category
          </span>

          <select
            value={category}
            onChange={(event) =>
              setCategory(
                event.target
                  .value as VehiclePhotoCategory,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            {PHOTO_CATEGORIES.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Sort order
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Title
        </span>

        <input
          type="text"
          maxLength={150}
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="Example: Front inspection"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">
          Description
        </span>

        <textarea
          rows={4}
          maxLength={2000}
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
          placeholder="Optional inspection or condition notes"
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <input
          type="checkbox"
          checked={isPrimary}
          onChange={(event) =>
            setIsPrimary(event.target.checked)
          }
          className="mt-1 h-5 w-5"
        />

        <span>
          <span className="block font-semibold text-slate-900">
            Primary photo
          </span>

          <span className="mt-1 block text-sm text-slate-500">
            Use this photo as the main vehicle image.
          </span>
        </span>
      </label>

      <div className="flex flex-wrap justify-end gap-3 border-t border-sky-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? 'Saving...'
            : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
