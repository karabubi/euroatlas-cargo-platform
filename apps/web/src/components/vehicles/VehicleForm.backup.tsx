"use client";

import { FormEvent, useEffect, useState } from "react";
import { getShipments } from "@/lib/shipments-api";
import type { Shipment } from "@/types/shipment";

type VehicleFormData = {
  vehicleNo: string;
  shipmentId: string;
  make: string;
  model: string;
};

type VehicleFormProps = {
  onSubmit?: (data: VehicleFormData) => Promise<void> | void;
};

function getCustomerName(shipment: Shipment): string {
  const customer = shipment.customer;

  if (!customer) {
    return "Unknown customer";
  }

  if (customer.companyName?.trim()) {
    return customer.companyName;
  }

  const fullName = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Unknown customer";
}

function getShipmentLabel(shipment: Shipment): string {
  const route = `${shipment.originCountry} → ${shipment.destinationCountry}`;
  const customerName = getCustomerName(shipment);

  return `${shipment.shipmentNo} — ${customerName} — ${route}`;
}

export default function VehicleForm({ onSubmit }: VehicleFormProps) {
  const [vehicleNo, setVehicleNo] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoadingShipments, setIsLoadingShipments] = useState(true);
  const [shipmentError, setShipmentError] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadShipments() {
      try {
        setShipmentError("");
        const data = await getShipments();

        if (isMounted) {
          setShipments(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setShipmentError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load shipments.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingShipments(false);
        }
      }
    }

    void loadShipments();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !vehicleNo.trim() ||
      !shipmentId ||
      !make.trim() ||
      !model.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit?.({
        vehicleNo: vehicleNo.trim(),
        shipmentId,
        make: make.trim(),
        model: model.trim(),
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save vehicle.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-xl border border-slate-200 bg-white p-6"
    >
      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {shipmentError ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
          {shipmentError}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="vehicleNo"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Vehicle Number *
          </label>

          <input
            id="vehicleNo"
            type="text"
            value={vehicleNo}
            onChange={(event) => setVehicleNo(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            placeholder="VEH-0001"
          />
        </div>

        <div>
          <label
            htmlFor="shipmentId"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Shipment *
          </label>

          <select
            id="shipmentId"
            value={shipmentId}
            onChange={(event) => setShipmentId(event.target.value)}
            disabled={isLoadingShipments || Boolean(shipmentError)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          >
            <option value="">
              {isLoadingShipments
                ? "Loading shipments..."
                : shipments.length === 0
                  ? "No shipments available"
                  : "Select a shipment"}
            </option>

            {shipments.map((shipment) => (
              <option key={shipment.id} value={shipment.id}>
                {getShipmentLabel(shipment)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="make"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Make *
          </label>

          <input
            id="make"
            type="text"
            value={make}
            onChange={(event) => setMake(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            placeholder="Toyota"
          />
        </div>

        <div>
          <label
            htmlFor="model"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Model *
          </label>

          <input
            id="model"
            type="text"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            placeholder="Corolla"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={
          isSubmitting ||
          isLoadingShipments ||
          shipments.length === 0
        }
        className="rounded-lg bg-slate-900 px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Save Vehicle"}
      </button>
    </form>
  );
}
