'use client';

import { useState } from 'react';

import VehiclePhotoMetadataEditor from './VehiclePhotoMetadataEditor';

import {
  deleteVehiclePhoto,
  downloadVehiclePhoto,
  getVehiclePhotoFileUrl,
  updateVehiclePhoto,
} from '@/lib/vehicle-photos-api';
import type {
  VehiclePhoto,
  VehiclePhotoCategory,
} from '@/types/vehicle-photo';

type VehiclePhotoGalleryProps = {
  photos: VehiclePhoto[];
  onChanged: (photos: VehiclePhoto[]) => void;
};

function formatCategory(
  category: VehiclePhotoCategory,
): string {
  return category
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default function VehiclePhotoGallery({
  photos,
  onChanged,
}: VehiclePhotoGalleryProps) {
  const [busyPhotoId, setBusyPhotoId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState('');


  const [editingPhotoId, setEditingPhotoId] =
    useState<string | null>(null);

  async function handlePrimary(
    photo: VehiclePhoto,
  ) {
    setBusyPhotoId(photo.id);
    setErrorMessage('');

    try {
      const updatedPhoto =
        await updateVehiclePhoto(photo.id, {
          isPrimary: true,
        });

      onChanged(
        photos.map((currentPhoto) => ({
          ...currentPhoto,
          isPrimary:
            currentPhoto.id === updatedPhoto.id,
        })),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The primary photo could not be changed.',
      );
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function handleDownload(
    photo: VehiclePhoto,
  ) {
    setBusyPhotoId(photo.id);
    setErrorMessage('');

    try {
      await downloadVehiclePhoto(photo);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The photo could not be downloaded.',
      );
    } finally {
      setBusyPhotoId(null);
    }
  }

  async function handleDelete(
    photo: VehiclePhoto,
  ) {
    const confirmed = window.confirm(
      `Delete photo "${photo.title || photo.originalName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setBusyPhotoId(photo.id);
    setErrorMessage('');

    try {
      await deleteVehiclePhoto(photo.id);

      onChanged(
        photos.filter(
          (currentPhoto) =>
            currentPhoto.id !== photo.id,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The photo could not be deleted.',
      );
    } finally {
      setBusyPhotoId(null);
    }
  }

  if (photos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
        <p className="text-lg font-semibold text-slate-900">
          No vehicle photos uploaded
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Upload the first inspection or condition
          photo for this vehicle.
        </p>
      </div>
    );
  }

  return (
    <div>
      {errorMessage ? (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {photos.map((photo) => {
          const isBusy =
            busyPhotoId === photo.id;

          return (
            <article
              key={photo.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative h-56 bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getVehiclePhotoFileUrl(
                    photo.id,
                  )}
                  alt={
                    photo.title ||
                    photo.originalName
                  }
                  className="h-full w-full object-cover"
                />

                {photo.isPrimary ? (
                  <span className="absolute left-3 top-3 rounded-full bg-sky-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Primary
                  </span>
                ) : null}

                <span className="absolute right-3 top-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
                  {formatCategory(photo.category)}
                </span>
              </div>

              <div className="p-5">
                <h4 className="text-lg font-bold text-slate-950">
                  {photo.title ||
                    formatCategory(photo.category)}
                </h4>

                <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                  {photo.description ||
                    'No description provided.'}
                </p>

                <dl className="mt-4 space-y-2 text-sm text-slate-500">
                  <div className="flex justify-between gap-3">
                    <dt>File</dt>
                    <dd className="truncate font-medium text-slate-700">
                      {photo.originalName}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt>Size</dt>
                    <dd className="font-medium text-slate-700">
                      {formatSize(photo.size)}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-3">
                    <dt>Uploaded</dt>
                    <dd className="text-right font-medium text-slate-700">
                      {formatDate(photo.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {!photo.isPrimary ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        void handlePrimary(photo)
                      }
                      className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
                    >
                      Set Primary
                    </button>
                  ) : (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700">
                      Main Photo
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void handleDownload(photo)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Download
                  </button>

                  <a
                    href={getVehiclePhotoFileUrl(
                      photo.id,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Full Size
                  </a>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      setEditingPhotoId(photo.id)
                    }
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      void handleDelete(photo)
                    }
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    {isBusy
                      ? 'Working...'
                      : 'Delete'}
                  </button>
                </div>

                {editingPhotoId === photo.id ? (
                  <div className="mt-5">
                    <VehiclePhotoMetadataEditor
                      photo={photo}
                      onCancel={() =>
                        setEditingPhotoId(null)
                      }
                      onSaved={(updatedPhoto) => {
                        onChanged(
                          photos.map((currentPhoto) => {
                            if (
                              updatedPhoto.isPrimary
                            ) {
                              return {
                                ...currentPhoto,
                                ...(
                                  currentPhoto.id ===
                                  updatedPhoto.id
                                    ? updatedPhoto
                                    : {
                                        isPrimary:
                                          false,
                                      }
                                ),
                              };
                            }

                            return currentPhoto.id ===
                              updatedPhoto.id
                              ? updatedPhoto
                              : currentPhoto;
                          }),
                        );

                        setEditingPhotoId(null);
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
