"use client";

import { FormEvent, useMemo, useState } from "react";

import { deliverShipment } from "@/lib/shipments-api";

type DeliveryShipment = {
  id: string;
  shipmentNo: string;
  status: string;
  isActive: boolean;
  originCountry: string;
  destinationCountry: string;
};

type DeliveryBlocker = {
  key?: string;
  label?: string;
  message: string;
};

type Props = {
  shipment: DeliveryShipment;
  isReady: boolean;
  readinessPercentage: number;
  blockers?: DeliveryBlocker[];
  onDelivered?: () => void;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to complete shipment delivery.";
}

export default function ShipmentDeliveryPanel({
  shipment,
  isReady,
  readinessPercentage,
  blockers = [],
  onDelivered,
}: Props) {
  const [location, setLocation] = useState("");

  const [deliveredTo, setDeliveredTo] = useState("");

  const [proofReference, setProofReference] = useState("");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const alreadyDelivered = shipment.status === "DELIVERED";

  const canDeliver = shipment.status === "READY_FOR_DELIVERY";

  const normalizedBlockers = useMemo(
    () => blockers.map((blocker) => blocker.message).filter(Boolean),
    [blockers],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    const cleanLocation = location.trim();

    if (!cleanLocation) {
      setError("Delivery location is required.");

      return;
    }

    if (alreadyDelivered) {
      setError("Shipment has already been delivered.");

      return;
    }

    if (!canDeliver) {
      setError(
        "Shipment must be READY_FOR_DELIVERY before final delivery can be recorded.",
      );

      return;
    }

    if (!isReady) {
      setError("Shipment readiness checks must pass before final delivery.");

      return;
    }

    try {
      setIsSubmitting(true);

      const result = await deliverShipment(shipment.id, {
        location: cleanLocation,

        deliveredTo: deliveredTo.trim() || undefined,

        proofReference: proofReference.trim() || undefined,

        notes: notes.trim() || undefined,
      });

      setSuccess(result.message || "Shipment delivered successfully.");

      onDelivered?.();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-600">
            Final delivery
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            Complete delivery
          </h2>

          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Record the final handover and proof-of-delivery information.
          </p>
        </div>

        <div
          className={[
            "rounded-full px-5 py-2 text-sm font-bold",
            isReady
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          Readiness {readinessPercentage}%
        </div>
      </div>

      {alreadyDelivered && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
          This shipment has already been delivered. Current status:{" "}
          <strong>DELIVERED</strong>
        </div>
      )}

      {!alreadyDelivered && !canDeliver && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
          Final delivery becomes available when the shipment reaches{" "}
          <strong>READY_FOR_DELIVERY</strong>. Current status:{" "}
          <strong>{shipment.status}</strong>
        </div>
      )}

      {!isReady && normalizedBlockers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">Delivery blockers</p>

          <ul className="mt-3 space-y-2 text-sm text-red-700">
            {normalizedBlockers.map((message) => (
              <li key={message} className="flex gap-2">
                <span aria-hidden>•</span>

                <span>{message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-semibold text-slate-800">
              Delivery location *
            </span>

            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isSubmitting || alreadyDelivered}
              required
              maxLength={200}
              placeholder="Tripoli Customer Delivery Point, Libya"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold text-slate-800">
              Delivered to
            </span>

            <input
              type="text"
              value={deliveredTo}
              onChange={(event) => setDeliveredTo(event.target.value)}
              disabled={isSubmitting || alreadyDelivered}
              maxLength={150}
              placeholder="Customer or authorized recipient"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block font-semibold text-slate-800">
            Proof of delivery reference
          </span>

          <input
            type="text"
            value={proofReference}
            onChange={(event) => setProofReference(event.target.value)}
            disabled={isSubmitting || alreadyDelivered}
            maxLength={150}
            placeholder="POD-2026-0001"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-semibold text-slate-800">
            Delivery notes
          </span>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting || alreadyDelivered}
            rows={4}
            maxLength={2000}
            placeholder="Optional handover or delivery notes"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={
              isSubmitting || !canDeliver || !isReady || alreadyDelivered
            }
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Completing Delivery..."
              : "Complete Final Delivery"}
          </button>
        </div>
      </form>
    </section>
  );
}
