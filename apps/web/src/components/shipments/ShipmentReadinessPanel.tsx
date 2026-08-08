"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getShipmentReadiness } from "@/lib/shipment-readiness-api";
import type { ShipmentReadinessResponse } from "@/types/shipment-readiness";
import ShipmentDispatchPanel from "./ShipmentDispatchPanel";
import ShipmentArrivalPanel from "./ShipmentArrivalPanel";
import ShipmentCustomsClearancePanel from "./ShipmentCustomsClearancePanel";
import ShipmentReadyForDeliveryPanel from "./ShipmentReadyForDeliveryPanel";
import ShipmentDeliveryPanel from "./ShipmentDeliveryPanel";
import ShipmentCancellationPanel from "./ShipmentCancellationPanel";

type ShipmentReadinessPanelProps = {
  shipmentId: string;
};

function formatValue(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ShipmentReadinessPanel({
  shipmentId,
}: ShipmentReadinessPanelProps) {
  const [readiness, setReadiness] = useState<ShipmentReadinessResponse | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const loadReadiness = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      try {
        const response = await getShipmentReadiness(shipmentId);

        setReadiness(response);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Shipment readiness could not be loaded.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [shipmentId],
  );

  useEffect(() => {
    // Initial synchronization with the shipment readiness API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReadiness();
  }, [loadReadiness]);

  if (isLoading) {
    return (
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">Loading shipment readiness...</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-xl font-bold text-red-900">
          Shipment readiness unavailable
        </h2>

        <p className="mt-3 text-sm text-red-700">{errorMessage}</p>

        <button
          type="button"
          onClick={() => void loadReadiness(true)}
          className="mt-5 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </section>
    );
  }

  if (!readiness) {
    return null;
  }

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
        <header
          className={
            readiness.isReady
              ? "bg-emerald-700 p-8 text-white"
              : "bg-slate-950 p-8 text-white"
          }
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">Shipment readiness</h2>

                <span
                  className={
                    readiness.isReady
                      ? "rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide"
                      : "rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-200"
                  }
                >
                  {readiness.isReady ? "Ready" : "Not Ready"}
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Review all operational checks before loading or dispatching this
                shipment.
              </p>
            </div>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void loadReadiness(true)}
              className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Readiness"}
            </button>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">Readiness score</p>

                <p className="mt-1 text-5xl font-bold">
                  {readiness.readinessPercentage}%
                </p>
              </div>

              <p className="text-sm text-slate-300">
                {readiness.summary.passedChecks} of{" "}
                {readiness.summary.totalChecks} checks passed
              </p>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
              <div
                className={
                  readiness.isReady
                    ? "h-full rounded-full bg-emerald-300 transition-all"
                    : "h-full rounded-full bg-sky-400 transition-all"
                }
                style={{
                  width: `${readiness.readinessPercentage}%`,
                }}
              />
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Passed checks</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">
                {readiness.summary.passedChecks}
              </p>
            </div>

            <div className="rounded-2xl bg-red-50 p-5">
              <p className="text-sm text-red-700">Blockers</p>
              <p className="mt-2 text-3xl font-bold text-red-900">
                {readiness.summary.blockerCount}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-5">
              <p className="text-sm text-amber-700">Warnings</p>
              <p className="mt-2 text-3xl font-bold text-amber-900">
                {readiness.summary.warningCount}
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-5">
              <p className="text-sm text-sky-700">Approved vehicles</p>
              <p className="mt-2 text-3xl font-bold text-sky-900">
                {readiness.summary.approvedVehicleCount}/
                {readiness.summary.vehicleCount}
              </p>
            </div>
          </div>

          <section className="mt-8">
            <h3 className="text-xl font-bold text-slate-950">
              Readiness checklist
            </h3>

            <div className="mt-5 grid gap-3">
              {readiness.checks.map((check) => (
                <article
                  key={check.key}
                  className={
                    check.passed
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
                      : check.blocking
                        ? "rounded-2xl border border-red-200 bg-red-50 p-5"
                        : "rounded-2xl border border-amber-200 bg-amber-50 p-5"
                  }
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={
                        check.passed
                          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white"
                          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold text-white"
                      }
                    >
                      {check.passed ? "✓" : "!"}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-slate-950">
                          {check.label}
                        </h4>

                        {!check.passed && check.blocking ? (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold uppercase text-red-700">
                            Blocking
                          </span>
                        ) : null}

                        {!check.passed && !check.blocking ? (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold uppercase text-amber-700">
                            Warning
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {check.message}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {readiness.blockers.length > 0 ? (
            <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
              <h3 className="text-lg font-bold text-red-900">
                Blocking problems
              </h3>

              <div className="mt-4 grid gap-3">
                {readiness.blockers.map((blocker) => (
                  <div key={blocker.key} className="rounded-xl bg-white p-4">
                    <p className="font-semibold text-red-900">
                      {blocker.label}
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {blocker.message}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-950">
                  Vehicle readiness
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Inspection approvals and unresolved critical damage.
                </p>
              </div>
            </div>

            {readiness.vehicles.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                No active vehicles are connected to this shipment.
              </div>
            ) : (
              <div className="mt-5 grid gap-4">
                {readiness.vehicles.map((vehicle) => (
                  <article
                    key={vehicle.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/dashboard/vehicles/${vehicle.id}`}
                            className="font-bold text-sky-700 hover:underline"
                          >
                            {vehicle.vehicleNo}
                          </Link>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                            {formatValue(vehicle.status)}
                          </span>

                          <span
                            className={
                              vehicle.hasApprovedInspection
                                ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase text-emerald-700"
                                : "rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase text-red-700"
                            }
                          >
                            {vehicle.hasApprovedInspection
                              ? "Inspection approved"
                              : "Approval required"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>

                      <div className="text-sm text-slate-600">
                        <p>
                          Inspections:{" "}
                          <span className="font-semibold text-slate-900">
                            {vehicle.inspectionCount}
                          </span>
                        </p>

                        <p className="mt-1">
                          Critical damage:{" "}
                          <span
                            className={
                              vehicle.unresolvedCriticalDamageCount > 0
                                ? "font-semibold text-red-700"
                                : "font-semibold text-emerald-700"
                            }
                          >
                            {vehicle.unresolvedCriticalDamageCount}
                          </span>
                        </p>
                      </div>
                    </div>

                    {vehicle.latestInspection ? (
                      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
                        <p className="font-semibold text-slate-900">
                          Latest inspection:{" "}
                          <Link
                            href={`/dashboard/inspections/${vehicle.latestInspection.id}`}
                            className="text-sky-700 hover:underline"
                          >
                            {vehicle.latestInspection.inspectionNo}
                          </Link>
                        </p>

                        <p className="mt-1 text-slate-600">
                          {formatValue(vehicle.latestInspection.status)} ·{" "}
                          {formatValue(vehicle.latestInspection.approvalStatus)}{" "}
                          ·{" "}
                          {formatDate(vehicle.latestInspection.inspectionDate)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        No inspection has been recorded for this vehicle.
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <footer className="mt-8 border-t border-slate-200 pt-5 text-sm text-slate-500">
            Last evaluated: {formatDate(readiness.evaluatedAt)}
          </footer>
        </div>
      </section>

      <ShipmentCancellationPanel
        shipmentId={readiness.shipment.id}
        shipmentNo={readiness.shipment.shipmentNo}
        currentStatus={readiness.shipment.status}
        onCancelled={() => void loadReadiness(true)}
      />

      <ShipmentDispatchPanel
        shipmentId={readiness.shipment.id}
        shipmentNo={readiness.shipment.shipmentNo}
        currentStatus={readiness.shipment.status}
        isReady={readiness.isReady}
        readinessPercentage={readiness.readinessPercentage}
        blockers={readiness.blockers}
        onDispatched={() => void loadReadiness(true)}
      />
      <ShipmentArrivalPanel
        shipmentId={readiness.shipment.id}
        shipmentNo={readiness.shipment.shipmentNo}
        currentStatus={readiness.shipment.status}
        isReady={readiness.isReady}
        readinessPercentage={readiness.readinessPercentage}
        blockers={readiness.blockers}
        onArrived={() => void loadReadiness(true)}
      />

      <ShipmentCustomsClearancePanel
        shipment={readiness.shipment}
        isReady={readiness.isReady}
        readinessPercentage={readiness.readinessPercentage}
        blockers={readiness.blockers}
        onCustomsStarted={() => void loadReadiness(true)}
      />

      <ShipmentReadyForDeliveryPanel
        shipment={readiness.shipment}
        isReady={readiness.isReady}
        readinessPercentage={readiness.readinessPercentage}
        blockers={readiness.blockers}
        onReadyForDelivery={() => void loadReadiness(true)}
      />

      <ShipmentDeliveryPanel
        shipment={readiness.shipment}
        isReady={readiness.isReady}
        readinessPercentage={readiness.readinessPercentage}
        blockers={readiness.blockers}
        onDelivered={() => void loadReadiness(true)}
      />
    </div>
  );
}
