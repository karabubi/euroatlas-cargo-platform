"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import VehicleInspectionCard from "@/components/vehicle-inspections/VehicleInspectionCard";
import { getVehicleInspection } from "@/lib/vehicle-inspections-api";
import type { VehicleInspection } from "@/types/vehicle-inspection";

export default function InspectionDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const inspectionId = params.id;

  const [inspection, setInspection] = useState<VehicleInspection | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");

  const loadInspection = useCallback(async () => {
    if (!inspectionId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await getVehicleInspection(inspectionId);

      setInspection(response);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The inspection could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    // Initial synchronization with the inspection API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInspection();
  }, [loadInspection]);

  function handleDeleted() {
    router.push("/dashboard/inspections");
    router.refresh();
  }

  return (
    <main className="space-y-8">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-sky-600">
              EuroAtlas Cargo
            </p>

            <h1 className="mt-3 text-4xl font-bold text-slate-950">
              Inspection details
            </h1>

            <p className="mt-3 text-slate-600">
              Review and manage one vehicle inspection, its condition and damage
              reports.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/inspections"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to inspections
            </Link>

            {inspection?.vehicleId ? (
              <Link
                href={`/dashboard/vehicles/${inspection.vehicleId}`}
                className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
              >
                Open vehicle
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">Loading inspection...</p>
        </section>
      ) : null}

      {!isLoading && errorMessage ? (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-8">
          <h2 className="text-xl font-bold text-red-900">
            Inspection could not be loaded
          </h2>

          <p className="mt-3 text-red-700">{errorMessage}</p>

          <button
            type="button"
            onClick={() => void loadInspection()}
            className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            Try again
          </button>
        </section>
      ) : null}

      {!isLoading && inspection ? (
        <VehicleInspectionCard
          inspection={inspection}
          onChanged={setInspection}
          onDeleted={handleDeleted}
        />
      ) : null}
    </main>
  );
}
