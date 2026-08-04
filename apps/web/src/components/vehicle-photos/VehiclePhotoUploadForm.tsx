'use client';

import {
  ChangeEvent,
  FormEvent,
  useRef,
  useState,
} from 'react';

import { uploadVehiclePhoto } from '@/lib/vehicle-photos-api';
import type {
  VehiclePhoto,
  VehiclePhotoCategory,
} from '@/types/vehicle-photo';

type VehiclePhotoUploadFormProps = {
  vehicleId: string;
  onUploaded: (photo: VehiclePhoto) => void;
};

const categories: {
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

const acceptedFileTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const maxFileSize = 10 * 1024 * 1024;

export default function VehiclePhotoUploadForm({
  vehicleId,
  onUploaded,
}: VehiclePhotoUploadFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(
    null,
  );

  const [file, setFile] = useState<File | null>(
    null,
  );

  const [previewUrl, setPreviewUrl] = useState<
    string | null
  >(null);

  const [category, setCategory] =
    useState<VehiclePhotoCategory>('FRONT');

  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');

  const [isPrimary, setIsPrimary] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
  }

  function resetForm() {
    clearPreview();

    setFile(null);
    setCategory('FRONT');
    setTitle('');
    setDescription('');
    setIsPrimary(false);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const selectedFile =
      event.target.files?.[0] ?? null;

    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedFile) {
      clearPreview();
      setFile(null);
      return;
    }

    if (
      !acceptedFileTypes.includes(
        selectedFile.type,
      )
    ) {
      setErrorMessage(
        'Only JPG, PNG, WebP, HEIC and HEIF files are allowed.',
      );

      event.target.value = '';
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setErrorMessage(
        'The image must be smaller than 10 MB.',
      );

      event.target.value = '';
      return;
    }

    clearPreview();

    setFile(selectedFile);

    if (
      selectedFile.type !== 'image/heic' &&
      selectedFile.type !== 'image/heif'
    ) {
      setPreviewUrl(
        URL.createObjectURL(selectedFile),
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!file) {
      setErrorMessage(
        'Please select a vehicle photo.',
      );
      return;
    }

    setIsUploading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const uploadedPhoto =
        await uploadVehiclePhoto({
          vehicleId,
          file,
          category,
          title: title.trim() || undefined,
          description:
            description.trim() || undefined,
          isPrimary,
          sortOrder: 0,
        });

      onUploaded(uploadedPhoto);

      setSuccessMessage(
        'Vehicle photo uploaded successfully.',
      );

      resetForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The vehicle photo could not be uploaded.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
    >
      <div>
        <h3 className="text-xl font-bold text-slate-950">
          Upload vehicle photo
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          Add inspection, condition, VIN or damage
          photographs. Maximum size: 10 MB.
        </p>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700">
            Image file
          </label>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handleFileChange}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
          />

          {file ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">
                {file.name}
              </p>

              <p className="mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : null}

          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Selected vehicle preview"
                className="h-56 w-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          <label>
            <span className="block text-sm font-semibold text-slate-700">
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
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {categories.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="block text-sm font-semibold text-slate-700">
              Title
            </span>

            <input
              type="text"
              value={title}
              maxLength={150}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Example: Front inspection"
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label>
            <span className="block text-sm font-semibold text-slate-700">
              Description
            </span>

            <textarea
              value={description}
              maxLength={2000}
              rows={4}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional inspection notes"
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(event) =>
                setIsPrimary(event.target.checked)
              }
              className="mt-1 h-4 w-4"
            />

            <span>
              <span className="block font-semibold text-slate-900">
                Primary photo
              </span>

              <span className="mt-1 block text-sm text-slate-500">
                Use this as the main vehicle image.
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={isUploading || !file}
          className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading
            ? 'Uploading photo...'
            : 'Upload Photo'}
        </button>
      </div>
    </form>
  );
}
