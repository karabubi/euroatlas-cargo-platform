'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import VehiclePhotoGallery from './VehiclePhotoGallery';
import VehiclePhotoUploadForm from './VehiclePhotoUploadForm';

import { getVehiclePhotos } from '@/lib/vehicle-photos-api';
import type { VehiclePhoto } from '@/types/vehicle-photo';

type VehiclePhotosPanelProps = {
  vehicleId: string;
};

export default function VehiclePhotosPanel({
  vehicleId,
}: VehiclePhotosPanelProps) {
  const [photos, setPhotos] = useState<
    VehiclePhoto[]
  >([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const loadPhotos = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage('');

      try {
        const response =
          await getVehiclePhotos(vehicleId);

        setPhotos(response.photos);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Vehicle photos could not be loaded.',
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [vehicleId],
  );

  useEffect(() => {
    // Initial synchronization with the photo API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPhotos();
  }, [loadPhotos]);

  function handleUploaded(
    uploadedPhoto: VehiclePhoto,
  ) {
    setPhotos((currentPhotos) => {
      const normalizedPhotos =
        uploadedPhoto.isPrimary
          ? currentPhotos.map((photo) => ({
              ...photo,
              isPrimary: false,
            }))
          : currentPhotos;

      return [
        uploadedPhoto,
        ...normalizedPhotos,
      ];
    });
  }

  return (
    <section className="rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Vehicle photos
          </h2>

          <p className="mt-2 text-slate-600">
            Manage inspection, condition, VIN and
            damage photographs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
            {photos.length}{' '}
            {photos.length === 1
              ? 'photo'
              : 'photos'}
          </span>

          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => void loadPhotos(true)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {isRefreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-8">
        <VehiclePhotoUploadForm
          vehicleId={vehicleId}
          onUploaded={handleUploaded}
        />
      </div>

      <div className="mt-8">
        <h3 className="mb-5 text-xl font-bold text-slate-950">
          Photo gallery
        </h3>

        {isLoading ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-slate-600">
            Loading vehicle photos...
          </div>
        ) : (
          <VehiclePhotoGallery
            photos={photos}
            onChanged={setPhotos}
          />
        )}
      </div>
    </section>
  );
}
