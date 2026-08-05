"use client";

import { useMemo, useState } from "react";

import { changeInspectionStatus } from "@/lib/vehicle-inspections-api";
import type {
  InspectionStatus,
  InspectionStatusHistory,
  VehicleInspection,
} from "@/types/vehicle-inspection";
import { formatInspectionValue } from "@/types/vehicle-inspection";

type InspectionStatusWorkflowProps = {
  inspection: VehicleInspection;
  onChanged: (inspection: VehicleInspection) => void;
};

type StatusTransition = {
  status: InspectionStatus;
  label: string;
  description: string;
};

const statusTransitions: Record<InspectionStatus, StatusTransition[]> = {
  DRAFT: [
    {
      status: "IN_PROGRESS",
      label: "Start Inspection",
      description: "Begin the inspection process.",
    },
    {
      status: "CANCELLED",
      label: "Cancel Inspection",
      description: "Cancel this draft inspection.",
    },
  ],

  IN_PROGRESS: [
    {
      status: "COMPLETED",
      label: "Complete Inspection",
      description: "Mark all inspection work as completed.",
    },
    {
      status: "DRAFT",
      label: "Return to Draft",
      description: "Return the inspection to draft status.",
    },
    {
      status: "CANCELLED",
      label: "Cancel Inspection",
      description: "Stop and cancel this inspection.",
    },
  ],

  COMPLETED: [
    {
      status: "IN_PROGRESS",
      label: "Reopen Inspection",
      description: "Reopen the inspection for corrections.",
    },
  ],

  CANCELLED: [
    {
      status: "DRAFT",
      label: "Restore as Draft",
      description: "Restore the cancelled inspection.",
    },
  ],
};

function statusClass(status: InspectionStatus): string {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "IN_PROGRESS":
      return "bg-sky-50 text-sky-700 ring-sky-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function actionClass(status: InspectionStatus): string {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-600 hover:bg-emerald-700";

    case "CANCELLED":
      return "bg-red-600 hover:bg-red-700";

    case "IN_PROGRESS":
      return "bg-sky-600 hover:bg-sky-700";

    default:
      return "bg-slate-800 hover:bg-slate-900";
  }
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

export default function InspectionStatusWorkflow({
  inspection,
  onChanged,
}: InspectionStatusWorkflowProps) {
  const [selectedStatus, setSelectedStatus] = useState<InspectionStatus | null>(
    null,
  );

  const [note, setNote] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const transitions = useMemo(
    () => statusTransitions[inspection.status],
    [inspection.status],
  );

  async function handleStatusChange() {
    if (!selectedStatus) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedInspection = await changeInspectionStatus(inspection.id, {
        status: selectedStatus,
        note: note.trim() || undefined,
      });

      onChanged(updatedInspection);

      setSelectedStatus(null);
      setNote("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The inspection status could not be changed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const statusHistory: InspectionStatusHistory[] =
    inspection.statusHistory ?? [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            Workflow
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Inspection status
          </h2>

          <p className="mt-2 max-w-2xl text-slate-600">
            Change the inspection status and review its complete workflow
            history.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Current status
          </p>

          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ring-1 ${statusClass(
              inspection.status,
            )}`}
          >
            {formatInspectionValue(inspection.status)}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="text-lg font-bold text-slate-950">
            Available actions
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Select the next workflow status.
          </p>

          <div className="mt-5 grid gap-3">
            {transitions.map((transition) => {
              const selected = selectedStatus === transition.status;

              return (
                <button
                  key={transition.status}
                  type="button"
                  disabled={isSaving}
                  onClick={() => setSelectedStatus(transition.status)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-sky-500 bg-sky-50 ring-2 ring-sky-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  } disabled:opacity-50`}
                >
                  <span className="font-bold text-slate-950">
                    {transition.label}
                  </span>

                  <span className="mt-1 block text-sm text-slate-500">
                    {transition.description}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedStatus ? (
            <div className="mt-6">
              <label
                htmlFor="status-note"
                className="text-sm font-semibold text-slate-700"
              >
                Status-change note
              </label>

              <textarea
                id="status-note"
                rows={4}
                maxLength={1000}
                value={note}
                disabled={isSaving}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Explain why the status is being changed..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:opacity-50"
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setSelectedStatus(null);
                    setNote("");
                    setErrorMessage("");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleStatusChange()}
                  className={`rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${actionClass(
                    selectedStatus,
                  )}`}
                >
                  {isSaving
                    ? "Saving..."
                    : `Change to ${formatInspectionValue(selectedStatus)}`}
                </button>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-950">
                Status history
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {statusHistory.length} recorded{" "}
                {statusHistory.length === 1 ? "change" : "changes"}
              </p>
            </div>
          </div>

          {statusHistory.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-900">No status history</p>

              <p className="mt-2 text-sm text-slate-500">
                Status changes will appear here.
              </p>
            </div>
          ) : (
            <ol className="mt-6 space-y-5">
              {statusHistory.map((historyItem) => (
                <li
                  key={historyItem.id}
                  className="relative border-l-2 border-slate-200 pl-6"
                >
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-sky-500 ring-4 ring-white" />

                  <div className="flex flex-wrap items-center gap-2">
                    {historyItem.fromStatus ? (
                      <>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(
                            historyItem.fromStatus,
                          )}`}
                        >
                          {formatInspectionValue(historyItem.fromStatus)}
                        </span>

                        <span className="text-slate-400">→</span>
                      </>
                    ) : null}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClass(
                        historyItem.toStatus,
                      )}`}
                    >
                      {formatInspectionValue(historyItem.toStatus)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {formatDate(historyItem.createdAt)}
                  </p>

                  {historyItem.changedBy ? (
                    <p className="mt-1 text-sm text-slate-600">
                      Changed by{" "}
                      <span className="font-semibold text-slate-900">
                        {historyItem.changedBy}
                      </span>
                    </p>
                  ) : null}

                  {historyItem.note ? (
                    <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      {historyItem.note}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
