"use client";

import { FormEvent, useMemo, useState } from "react";

import { startShipmentCustomsClearance } from "@/lib/shipments-api";

type CustomsShipment = {
  id: string;
  shipmentNo: string;
  status: string;
  isActive: boolean;
  originCountry: string;
  destinationCountry: string;
};

type CustomsBlocker = {
  key?: string;
  label?: string;
  message: string;
};

type Props = {
  shipment: CustomsShipment;
  isReady: boolean;
  readinessPercentage: number;
  blockers?: CustomsBlocker[];
  onCustomsStarted?: () => void;
};

const customsOrLaterStatuses = new Set([
  "CUSTOMS_CLEARANCE",
  "READY_FOR_DELIVERY",
  "DELIVERED",
]);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to start customs clearance.";
}

export default function ShipmentCustomsClearancePanel({
  shipment,
  isReady,
  readinessPercentage,
  blockers = [],
  onCustomsStarted,
}: Props) {
  const [location, setLocation] = useState("");

  const [handledBy, setHandledBy] = useState("");

  const [customsReference, setCustomsReference] = useState("");

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const alreadyInCustomsOrLater = customsOrLaterStatuses.has(shipment.status);

  const canStartCustoms = shipment.status === "ARRIVED";

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
      setError("Customs location is required.");

      return;
    }

    if (!canStartCustoms) {
      setError("Shipment must be ARRIVED before customs clearance can start.");

      return;
    }

    if (alreadyInCustomsOrLater) {
      setError("Customs clearance has already been started for this shipment.");

      return;
    }

    if (!isReady) {
      setError(
        "Shipment readiness checks must pass before customs clearance can start.",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const result = await startShipmentCustomsClearance(shipment.id, {
        location: cleanLocation,

        handledBy: handledBy.trim() || undefined,

        customsReference: customsReference.trim() || undefined,

        notes: notes.trim() || undefined,
      });

      setSuccess(result.message || "Customs clearance started successfully.");

      onCustomsStarted?.();
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
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-600">
            Customs workflow
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-950">
            Customs clearance
          </h2>

          <p className="mt-2 max-w-3xl text-base text-slate-600">
            Start customs processing after the shipment has arrived at its
            destination.
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

      {alreadyInCustomsOrLater && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800">
          Customs clearance has already been started for this shipment. Current
          status: <strong>{shipment.status}</strong>
        </div>
      )}

      {!alreadyInCustomsOrLater && !canStartCustoms && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
          Customs clearance becomes available when the shipment reaches{" "}
          <strong>ARRIVED</strong>. Current status:{" "}
          <strong>{shipment.status}</strong>
        </div>
      )}

      {!isReady && normalizedBlockers.length > 0 && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-800">Readiness blockers</p>

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
              Customs location *
            </span>

            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isSubmitting || alreadyInCustomsOrLater}
              placeholder="Tripoli Customs Terminal, Libya"
              maxLength={200}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block font-semibold text-slate-800">
              Handled by
            </span>

            <input
              type="text"
              value={handledBy}
              onChange={(event) => setHandledBy(event.target.value)}
              disabled={isSubmitting || alreadyInCustomsOrLater}
              placeholder="Customs operations employee"
              maxLength={150}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block font-semibold text-slate-800">
            Customs reference
          </span>

          <input
            type="text"
            value={customsReference}
            onChange={(event) => setCustomsReference(event.target.value)}
            disabled={isSubmitting || alreadyInCustomsOrLater}
            placeholder="CUS-2026-0001"
            maxLength={150}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>

        <label className="block">
          <span className="mb-2 block font-semibold text-slate-800">Notes</span>

          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting || alreadyInCustomsOrLater}
            rows={4}
            maxLength={2000}
            placeholder="Optional customs clearance notes"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !canStartCustoms ||
              !isReady ||
              alreadyInCustomsOrLater
            }
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Starting Customs Clearance..."
              : "Start Customs Clearance"}
          </button>
        </div>
      </form>
    </section>
  );
}
