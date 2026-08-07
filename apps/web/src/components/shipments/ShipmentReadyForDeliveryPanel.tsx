"use client";

import { FormEvent, useMemo, useState } from "react";

import { markShipmentReadyForDelivery } from "@/lib/shipments-api";

type ReadyShipment = {
  id: string;
  shipmentNo: string;
  status: string;
  isActive: boolean;
  originCountry: string;
  destinationCountry: string;
};

type ReadinessBlocker = {
  key?: string;
  label?: string;
  message: string;
};

type Props = {
  shipment: ReadyShipment;
  isReady: boolean;
  readinessPercentage: number;
  blockers?: ReadinessBlocker[];
  onReadyForDelivery?: () => void;
};

const readyOrLaterStatuses = new Set(["READY_FOR_DELIVERY", "DELIVERED"]);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to mark shipment ready for delivery.";
}

export default function ShipmentReadyForDeliveryPanel({
  shipment,
  isReady,
  readinessPercentage,
  blockers = [],
  onReadyForDelivery,
}: Props) {
  const [location, setLocation] = useState("");

  const [releasedBy, setReleasedBy] = useState("");

  const [releaseReference, setReleaseReference] = useState("");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const alreadyReadyOrDelivered = readyOrLaterStatuses.has(shipment.status);

  const canMarkReady = shipment.status === "CUSTOMS_CLEARANCE";

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
      setError("Delivery release location is required.");

      return;
    }

    if (!canMarkReady) {
      setError(
        "Shipment must be in CUSTOMS_CLEARANCE before it can be marked READY_FOR_DELIVERY.",
      );

      return;
    }

    if (alreadyReadyOrDelivered) {
      setError("Shipment is already ready for delivery or delivered.");

      return;
    }

    if (!isReady) {
      setError(
        "Shipment readiness checks must pass before it can be released for delivery.",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const result = await markShipmentReadyForDelivery(shipment.id, {
        location: cleanLocation,

        releasedBy: releasedBy.trim() || undefined,

        releaseReference: releaseReference.trim() || undefined,

        notes: notes.trim() || undefined,
      });

      setSuccess(
        result.message || "Shipment marked ready for delivery successfully.",
      );

      onReadyForDelivery?.();
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
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
            Delivery workflow
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            Ready for delivery
          </h2>

          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Release the shipment from customs and prepare it for final delivery.
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

      {alreadyReadyOrDelivered && (
        <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-800">
          This shipment has already reached the delivery stage. Current status:{" "}
          <strong>{shipment.status}</strong>
        </div>
      )}

      {!alreadyReadyOrDelivered && !canMarkReady && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
          Ready-for-delivery processing becomes available when the shipment
          reaches <strong>CUSTOMS_CLEARANCE</strong>. Current status:{" "}
          <strong>{shipment.status}</strong>
        </div>
      )}

      {!isReady && normalizedBlockers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">Release blockers</p>

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
              Release location *
            </span>

            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isSubmitting || alreadyReadyOrDelivered}
              placeholder="Tripoli Delivery Yard, Libya"
              maxLength={200}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold text-slate-800">
              Released by
            </span>

            <input
              type="text"
              value={releasedBy}
              onChange={(event) => setReleasedBy(event.target.value)}
              disabled={isSubmitting || alreadyReadyOrDelivered}
              placeholder="Delivery operations employee"
              maxLength={150}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block font-semibold text-slate-800">
            Release reference
          </span>

          <input
            type="text"
            value={releaseReference}
            onChange={(event) => setReleaseReference(event.target.value)}
            disabled={isSubmitting || alreadyReadyOrDelivered}
            placeholder="REL-2026-0001"
            maxLength={150}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-semibold text-slate-800">Notes</span>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting || alreadyReadyOrDelivered}
            rows={4}
            maxLength={2000}
            placeholder="Optional delivery release notes"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !canMarkReady ||
              !isReady ||
              alreadyReadyOrDelivered
            }
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Marking Ready..." : "Mark Ready for Delivery"}
          </button>
        </div>
      </form>
    </section>
  );
}
