"use client";

import { FormEvent, useMemo, useState } from "react";

import { cancelShipment } from "@/lib/shipments-api";
import type { CancelShipmentInput, ShipmentStatus } from "@/types/shipment";

type Props = {
  shipmentId: string;
  shipmentNo: string;
  currentStatus: ShipmentStatus;
  onCancelled?: () => void;
};

const CANCELLABLE_STATUSES: ShipmentStatus[] = [
  "DRAFT",
  "QUOTED",
  "BOOKED",
  "RECEIVED",
  "LOADED",
];

export default function ShipmentCancellationPanel({
  shipmentId,
  shipmentNo,
  currentStatus,
  onCancelled,
}: Props) {
  const [reason, setReason] = useState("");

  const [cancelledBy, setCancelledBy] = useState("");

  const [location, setLocation] = useState("");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const canCancel = useMemo(
    () => CANCELLABLE_STATUSES.includes(currentStatus),
    [currentStatus],
  );

  const alreadyCancelled = currentStatus === "CANCELLED";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canCancel || alreadyCancelled || isSubmitting) {
      return;
    }

    const cleanReason = reason.trim();

    if (!cleanReason) {
      setError("Please provide a cancellation reason.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const input: CancelShipmentInput = {
      reason: cleanReason,
    };

    if (cancelledBy.trim()) {
      input.cancelledBy = cancelledBy.trim();
    }

    if (location.trim()) {
      input.location = location.trim();
    }

    if (notes.trim()) {
      input.notes = notes.trim();
    }

    try {
      const response = await cancelShipment(shipmentId, input);

      setSuccess(response.message);

      setReason("");
      setCancelledBy("");
      setLocation("");
      setNotes("");

      onCancelled?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to cancel shipment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (alreadyCancelled) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-900">
          Shipment Cancelled
        </h3>

        <p className="mt-2 text-sm text-red-700">
          Shipment {shipmentNo} has already been cancelled. No further workflow
          actions are available.
        </p>
      </section>
    );
  }

  if (!canCancel) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-red-700">Cancel Shipment</h3>

        <p className="mt-2 text-sm text-slate-600">
          Shipment {shipmentNo} can still be cancelled because it has not
          departed. Cancellation becomes unavailable once the shipment is
          IN_TRANSIT.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label
            htmlFor="cancellation-reason"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Cancellation reason *
          </label>

          <textarea
            id="cancellation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={500}
            required
            rows={3}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            placeholder="Explain why this shipment is being cancelled."
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="cancelled-by"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Cancelled by
            </label>

            <input
              id="cancelled-by"
              value={cancelledBy}
              onChange={(event) => setCancelledBy(event.target.value)}
              maxLength={150}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Operations Team"
            />
          </div>

          <div>
            <label
              htmlFor="cancellation-location"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Location
            </label>

            <input
              id="cancellation-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              placeholder="Bonn Operations Office"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="cancellation-notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Additional notes
          </label>

          <textarea
            id="cancellation-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            placeholder="Optional internal cancellation notes."
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
            className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling Shipment..." : "Cancel Shipment"}
          </button>
        </div>
      </form>
    </section>
  );
}
