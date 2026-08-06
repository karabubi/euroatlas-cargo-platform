"use client";

import { FormEvent, useMemo, useState } from "react";

import { ApiError } from "@/lib/api";
import { dispatchShipment } from "@/lib/shipments-api";
import type { DispatchShipmentStatus } from "@/types/shipment";

type ShipmentDispatchPanelProps = {
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
  onDispatched?: () => void;
};

function currentLocalDateTime(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();

  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

export default function ShipmentDispatchPanel({
  shipmentId,
  shipmentNo,
  currentStatus,
  isReady,
  readinessPercentage,
  blockers,
  onDispatched,
}: ShipmentDispatchPanelProps) {
  const [status, setStatus] = useState<DispatchShipmentStatus>("IN_TRANSIT");

  const [location, setLocation] = useState("");

  const [dispatchedBy, setDispatchedBy] = useState("");

  const [departureTime, setDepartureTime] = useState(currentLocalDateTime());

  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const alreadyDispatched = useMemo(
    () =>
      [
        "IN_TRANSIT",
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

    if (!location.trim()) {
      setErrorMessage("A dispatch location is required.");
      return;
    }

    if (!isReady) {
      setErrorMessage(
        "The shipment cannot be dispatched until all readiness blockers are resolved.",
      );
      return;
    }

    if (alreadyDispatched) {
      setErrorMessage("This shipment has already been dispatched.");
      return;
    }

    const confirmed = window.confirm(
      `Dispatch shipment ${shipmentNo} as ${status.replaceAll("_", " ")}?`,
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await dispatchShipment(shipmentId, {
        status,
        location: location.trim(),
        dispatchedBy: dispatchedBy.trim() || undefined,
        departureTime: departureTime
          ? new Date(departureTime).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(response.message);

      onDispatched?.();

      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "The shipment could not be dispatched.",
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
          <p className="text-sm font-bold uppercase tracking-wide text-sky-700">
            Controlled workflow
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Shipment dispatch
          </h2>

          <p className="mt-2 text-slate-600">
            Confirm departure and create the dispatch tracking event.
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

      {alreadyDispatched ? (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sky-800">
          This shipment has already entered the dispatch workflow. Current
          status: <strong>{currentStatus.replaceAll("_", " ")}</strong>
        </div>
      ) : null}

      {!isReady ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-bold">Dispatch is currently blocked</p>

          <ul className="mt-3 space-y-2">
            {blockers.map((blocker) => (
              <li
                key={blocker.key}
                className="rounded-xl border border-red-200 bg-white p-3"
              >
                <p className="font-semibold">{blocker.label}</p>

                <p className="mt-1 text-sm">{blocker.message}</p>
              </li>
            ))}
          </ul>
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
              Dispatch status
            </span>

            <select
              value={status}
              disabled={isSubmitting || alreadyDispatched}
              onChange={(event) =>
                setStatus(event.target.value as DispatchShipmentStatus)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="LOADED">Loaded</option>

              <option value="IN_TRANSIT">In transit</option>
            </select>
          </label>

          <label className="grid gap-2">
            <span className="font-semibold text-slate-700">Departure time</span>

            <input
              type="datetime-local"
              value={departureTime}
              disabled={isSubmitting || alreadyDispatched}
              onChange={(event) => setDepartureTime(event.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="font-semibold text-slate-700">
              Dispatch location
            </span>

            <input
              value={location}
              disabled={isSubmitting || alreadyDispatched}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Hamburg Port, Germany"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>

          <label className="grid gap-2">
            <span className="font-semibold text-slate-700">Dispatched by</span>

            <input
              value={dispatchedBy}
              disabled={isSubmitting || alreadyDispatched}
              onChange={(event) => setDispatchedBy(event.target.value)}
              placeholder="Employee name"
              className="rounded-xl border border-slate-300 px-4 py-3"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="font-semibold text-slate-700">Dispatch notes</span>

          <textarea
            value={notes}
            disabled={isSubmitting || alreadyDispatched}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            placeholder="Optional dispatch information"
            className="rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <div>
          <button
            type="submit"
            disabled={isSubmitting || !isReady || alreadyDispatched}
            className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Dispatching..." : "Dispatch Shipment"}
          </button>
        </div>
      </form>
    </section>
  );
}
