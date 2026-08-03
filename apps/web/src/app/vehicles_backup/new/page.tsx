"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import VehicleForm from "@/components/vehicles/VehicleForm";
import { createVehicle } from "@/lib/vehicles-api";
import type { CreateVehicleInput } from "@/types/vehicle";

export default function NewVehiclePage() {
  const router = useRouter();

  async function handleCreateVehicle(
    data: CreateVehicleInput,
  ): Promise<void> {
    await createVehicle(data);

    router.push("/vehicles");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Vehicle management
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Add Vehicle
            </h1>

            <p className="mt-2 text-slate-600">
              Register a vehicle and assign it to an active shipment.
            </p>
          </div>

          <Link
            href="/vehicles"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Back to Vehicles
          </Link>
        </div>

        <VehicleForm onSubmit={handleCreateVehicle} />
      </div>
    </main>
  );
}
