"use client";

import { useState } from "react";

import {
  approveInspection,
  rejectInspection,
  revokeInspectionApproval,
} from "@/lib/vehicle-inspections-api";
import type {
  InspectionApprovalHistory,
  InspectionApprovalStatus,
  VehicleInspection,
} from "@/types/vehicle-inspection";
import { formatInspectionValue } from "@/types/vehicle-inspection";

type InspectionApprovalWorkflowProps = {
  inspection: VehicleInspection;
  onChanged: (inspection: VehicleInspection) => void;
};

type ApprovalAction = "APPROVE" | "REJECT" | "REVOKE";

function approvalStatusClass(status: InspectionApprovalStatus): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

function actionButtonClass(action: ApprovalAction): string {
  switch (action) {
    case "APPROVE":
      return "bg-emerald-600 hover:bg-emerald-700";

    case "REJECT":
      return "bg-red-600 hover:bg-red-700";

    case "REVOKE":
      return "bg-amber-600 hover:bg-amber-700";
  }
}

function actionTitle(action: ApprovalAction): string {
  switch (action) {
    case "APPROVE":
      return "Approve inspection";

    case "REJECT":
      return "Reject inspection";

    case "REVOKE":
      return "Revoke approval";
  }
}

function actionDescription(action: ApprovalAction): string {
  switch (action) {
    case "APPROVE":
      return "Confirm that this inspection has been reviewed and accepted.";

    case "REJECT":
      return "Reject the inspection because corrections or additional work are required.";

    case "REVOKE":
      return "Return the inspection to pending approval for another review.";
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

export default function InspectionApprovalWorkflow({
  inspection,
  onChanged,
}: InspectionApprovalWorkflowProps) {
  const [selectedAction, setSelectedAction] = useState<ApprovalAction | null>(
    null,
  );

  const [note, setNote] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const approvalHistory: InspectionApprovalHistory[] =
    inspection.approvalHistory ?? [];

  const availableActions: ApprovalAction[] =
    inspection.approvalStatus === "APPROVED"
      ? ["REVOKE"]
      : inspection.approvalStatus === "REJECTED"
        ? ["APPROVE"]
        : ["APPROVE", "REJECT"];

  async function handleAction() {
    if (!selectedAction) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    const input = {
      note: note.trim() || undefined,
    };

    try {
      let updatedInspection: VehicleInspection;

      switch (selectedAction) {
        case "APPROVE":
          updatedInspection = await approveInspection(inspection.id, input);
          break;

        case "REJECT":
          updatedInspection = await rejectInspection(inspection.id, input);
          break;

        case "REVOKE":
          updatedInspection = await revokeInspectionApproval(
            inspection.id,
            input,
          );
          break;
      }

      onChanged(updatedInspection);
      setSelectedAction(null);
      setNote("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The approval action could not be completed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
            Review
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            Inspection approval
          </h2>

          <p className="mt-2 max-w-2xl text-slate-600">
            Approve or reject the completed inspection and review its approval
            history.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Approval status
          </p>

          <span
            className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ring-1 ${approvalStatusClass(
              inspection.approvalStatus,
            )}`}
          >
            {formatInspectionValue(inspection.approvalStatus)}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl bg-slate-50 p-6">
          <h3 className="text-lg font-bold text-slate-950">Approval actions</h3>

          <p className="mt-1 text-sm text-slate-500">
            Select the appropriate review action.
          </p>

          {inspection.status !== "COMPLETED" ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              The inspection should normally be completed before it is approved.
            </div>
          ) : null}

          <div className="mt-5 grid gap-3">
            {availableActions.map((action) => {
              const selected = selectedAction === action;

              return (
                <button
                  key={action}
                  type="button"
                  disabled={isSaving}
                  onClick={() => setSelectedAction(action)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  } disabled:opacity-50`}
                >
                  <span className="font-bold text-slate-950">
                    {actionTitle(action)}
                  </span>

                  <span className="mt-1 block text-sm leading-6 text-slate-500">
                    {actionDescription(action)}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedAction ? (
            <div className="mt-6">
              <label
                htmlFor="approval-note"
                className="text-sm font-semibold text-slate-700"
              >
                Review note
              </label>

              <textarea
                id="approval-note"
                rows={5}
                maxLength={2000}
                value={note}
                disabled={isSaving}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Enter the reason or review note..."
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
              />

              <p className="mt-2 text-right text-xs text-slate-500">
                {note.length}/2000
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setSelectedAction(null);
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
                  onClick={() => void handleAction()}
                  className={`rounded-xl px-5 py-3 font-semibold text-white disabled:opacity-50 ${actionButtonClass(
                    selectedAction,
                  )}`}
                >
                  {isSaving ? "Saving..." : actionTitle(selectedAction)}
                </button>
              </div>
            </div>
          ) : null}

          {inspection.approvalNote ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Latest approval note
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {inspection.approvalNote}
              </p>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-950">Approval history</h3>

          <p className="mt-1 text-sm text-slate-500">
            {approvalHistory.length} recorded{" "}
            {approvalHistory.length === 1 ? "action" : "actions"}
          </p>

          {approvalHistory.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-900">
                No approval history
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Approval actions will appear here.
              </p>
            </div>
          ) : (
            <ol className="mt-6 space-y-5">
              {approvalHistory.map((historyItem) => (
                <li
                  key={historyItem.id}
                  className="relative border-l-2 border-slate-200 pl-6"
                >
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-violet-500 ring-4 ring-white" />

                  <div className="flex flex-wrap items-center gap-2">
                    {historyItem.fromStatus ? (
                      <>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${approvalStatusClass(
                            historyItem.fromStatus,
                          )}`}
                        >
                          {formatInspectionValue(historyItem.fromStatus)}
                        </span>

                        <span className="text-slate-400">→</span>
                      </>
                    ) : null}

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${approvalStatusClass(
                        historyItem.toStatus,
                      )}`}
                    >
                      {formatInspectionValue(historyItem.toStatus)}
                    </span>
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    {formatDate(historyItem.createdAt)}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Changed by{" "}
                    <span className="font-semibold text-slate-900">
                      {historyItem.changedByName || historyItem.changedBy}
                    </span>
                  </p>

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
