"use client";

import { FormEvent, useMemo, useState } from "react";

import { ApiError } from "@/lib/api";
import { markShipmentArrived } from "@/lib/shipments-api";

type ShipmentArrivalPanelProps = {
  shipmentId: string;
  shipmentNo: string;
  currentStatus: string;
  isReady: boolean;
  readinessPercentage: number;
  blockers: Array<{
    key: string;
    label: string;
    message: string;
  }>;
  onArrived?: () => void;
};

function currentLocalDateTime(): string {
  const now = new Date();

  const offset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
}

export default function ShipmentArrivalPanel({
  shipmentId,
  shipmentNo,
  currentStatus,
  isReady,
  readinessPercentage,
  blockers,
  onArrived,
}: ShipmentArrivalPanelProps) {
  const [location, setLocation] = useState("");

  const [receivedBy, setReceivedBy] = useState("");

  const [arrivalTime, setArrivalTime] = useState(currentLocalDateTime());

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const canRecordArrival = currentStatus === "IN_TRANSIT";

  const alreadyArrived = useMemo(
    () =>
      [
        "ARRIVED",
        "CUSTOMS_CLEARANCE",
        "READY_FOR_DELIVERY",
        "DELIVERED",
      ].includes(currentStatus),
    [currentStatus],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (alreadyArrived) {
      setErrorMessage("This shipment has already arrived.");

      return;
    }

    if (!canRecordArrival) {
      setErrorMessage(
        "The shipment must be IN TRANSIT before arrival can be recorded.",
      );

      return;
    }

    if (!isReady) {
      setErrorMessage(
        "Arrival cannot be recorded until the shipment readiness blockers are resolved.",
      );

      return;
    }

    if (!location.trim()) {
      setErrorMessage("An arrival location is required.");

      return;
    }

    const confirmed = window.confirm(
      `Record arrival for shipment ${shipmentNo}?`,
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await markShipmentArrived(shipmentId, {
        location: location.trim(),

        receivedBy: receivedBy.trim() || undefined,

        arrivalTime: arrivalTime
          ? new Date(arrivalTime).toISOString()
          : undefined,

        notes: notes.trim() || undefined,
      });

      setSuccessMessage(response.message);

      onArrived?.();

      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Shipment arrival could not be recorded.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
            Arrival workflow
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Shipment arrival
          </h2>

          <p className="mt-2 text-slate-600">
            Record arrival at the destination and automatically create the
            arrival tracking event.
          </p>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            isReady
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          Readiness {readinessPercentage}%
        </div>
      </div>

      {alreadyArrived ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
          Arrival has already been recorded for this shipment. Current status:{" "}
          <strong>{currentStatus.replaceAll("_", " ")}</strong>
        </div>
      ) : null}

      {!alreadyArrived && !canRecordArrival ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
          Arrival can be recorded only after the shipment reaches{" "}
          <strong>IN TRANSIT</strong>. Current status:{" "}
          <strong>{currentStatus.replaceAll("_", " ")}</strong>
        </div>
      ) : null}

      {canRecordArrival && !isReady ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-bold">
            Arrival is blocked by readiness requirements
          </p>

          <div className="mt-3 grid gap-2">
            {blockers.map((blocker) => (
              <div
                key={blocker.key}
                className="rounded-xl border border-red-200 bg-white p-3"
              >
                <p className="font-semibold">{blocker.label}</p>

                <p className="mt-1 text-sm">{blocker.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="font-semibold text-slate-700">
              Arrival location
            </span>

            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              disabled={isSubmitting || !canRecordArrival || alreadyArrived}
              placeholder="Tripoli Port, Libya"
              className="rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-semibold text-slate-700">Arrival time</span>

            <input
              type="datetime-local"
              value={arrivalTime}
              onChange={(event) => setArrivalTime(event.target.value)}
              disabled={isSubmitting || !canRecordArrival || alreadyArrived}
              className="rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="font-semibold text-slate-700">Received by</span>

          <input
            value={receivedBy}
            onChange={(event) => setReceivedBy(event.target.value)}
            disabled={isSubmitting || !canRecordArrival || alreadyArrived}
            placeholder="Arrival operations employee"
            className="rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
          />
        </label>

        <label className="grid gap-2">
          <span className="font-semibold text-slate-700">Arrival notes</span>

          <textarea
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isSubmitting || !canRecordArrival || alreadyArrived}
            placeholder="Optional arrival notes"
            className="rounded-xl border border-slate-300 px-4 py-3 disabled:bg-slate-100"
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={
              isSubmitting || !canRecordArrival || !isReady || alreadyArrived
            }
            className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Recording Arrival..." : "Record Shipment Arrival"}
          </button>
        </div>
      </form>
    </section>
  );
}
