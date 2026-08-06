"use client";

import { type FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import { createTrackingEvent } from "@/lib/tracking-api";

type AddTrackingEventFormProps = {
  shipmentId: string;
  onCreated: () => void;
};

type ReadinessBlocker = {
  key: string;
  label: string;
  message: string;
};

type ReadinessFailure = {
  readinessPercentage?: number;
  blockers: ReadinessBlocker[];
};

type FormState = {
  eventType: string;
  status: string;
  title: string;
  location: string;
  description: string;
};

type StatusOption = {
  value: string;
  label: string;
  defaultTitle: string;
};

const statusOptions: StatusOption[] = [
  {
    value: "",
    label: "No shipment status",
    defaultTitle: "",
  },
  {
    value: "DRAFT",
    label: "Draft",
    defaultTitle: "Shipment saved as draft",
  },
  {
    value: "QUOTED",
    label: "Quoted",
    defaultTitle: "Shipment quotation prepared",
  },
  {
    value: "BOOKED",
    label: "Booking confirmed",
    defaultTitle: "Shipment booking confirmed",
  },
  {
    value: "RECEIVED",
    label: "Vehicle received",
    defaultTitle: "Vehicle received",
  },
  {
    value: "CUSTOMS_CLEARANCE",
    label: "Customs processing",
    defaultTitle: "Customs clearance in progress",
  },
  {
    value: "LOADED",
    label: "Loaded",
    defaultTitle: "Vehicle loaded",
  },
  {
    value: "IN_TRANSIT",
    label: "In transit",
    defaultTitle: "Shipment in transit",
  },
  {
    value: "ARRIVED",
    label: "Arrived",
    defaultTitle: "Shipment arrived",
  },
  {
    value: "READY_FOR_DELIVERY",
    label: "Ready for delivery",
    defaultTitle: "Shipment ready for delivery",
  },
  {
    value: "DELIVERED",
    label: "Delivered",
    defaultTitle: "Shipment delivered",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    defaultTitle: "Shipment cancelled",
  },
];

const initialFormState: FormState = {
  eventType: "STATUS_CHANGED",
  status: "",
  title: "",
  location: "",
  description: "",
};

export default function AddTrackingEventForm({
  shipmentId,
  onCreated,
}: AddTrackingEventFormProps) {
  const [form, setForm] = useState<FormState>(initialFormState);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [readinessFailure, setReadinessFailure] =
    useState<ReadinessFailure | null>(null);

  const [successMessage, setSuccessMessage] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleEventTypeChange(value: string) {
    setForm((current) => ({
      ...current,
      eventType: value,
      status: value === "STATUS_CHANGED" ? current.status : "",
    }));
  }

  function handleStatusChange(value: string) {
    const selectedStatus = statusOptions.find(
      (option) => option.value === value,
    );

    setForm((current) => ({
      ...current,
      status: value,
      title: current.title.trim() || selectedStatus?.defaultTitle || "",
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const eventType = form.eventType.trim();
    const status = form.status.trim();
    const title = form.title.trim();

    if (!eventType) {
      setError("Please select an event type.");
      return;
    }

    if (eventType === "STATUS_CHANGED" && !status) {
      setError("Please select a shipment status.");
      return;
    }

    if (!title) {
      setError("Please enter a tracking-event title.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setReadinessFailure(null);
    setSuccessMessage("");

    try {
      await createTrackingEvent({
        shipmentId,
        eventType,
        title,
        status: eventType === "STATUS_CHANGED" ? status : undefined,
        location: form.location.trim() || undefined,
        description: form.description.trim() || undefined,
      });

      setForm(initialFormState);

      setSuccessMessage("Tracking event created successfully.");

      onCreated();
    } catch (requestError) {
      if (
        requestError instanceof ApiError &&
        requestError.status === 409 &&
        requestError.payload.code === "SHIPMENT_NOT_READY"
      ) {
        const blockers = Array.isArray(requestError.payload.blockers)
          ? requestError.payload.blockers
          : [];

        setReadinessFailure({
          readinessPercentage: requestError.payload.readinessPercentage,
          blockers,
        });

        setError(
          requestError.message || "The shipment is not ready for this status.",
        );
      } else {
        setReadinessFailure(null);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "The tracking event could not be created.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
          Shipment progress
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Add Tracking Event
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Record a shipment status, location, document, or note.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">{error}</p>

          {readinessFailure?.readinessPercentage !== undefined && (
            <p className="mt-2 text-sm">
              Readiness score:{" "}
              <span className="font-bold">
                {readinessFailure.readinessPercentage}%
              </span>
            </p>
          )}

          {readinessFailure && readinessFailure.blockers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold">
                Complete these requirements:
              </p>

              <ul className="mt-2 space-y-2">
                {readinessFailure.blockers.map((blocker) => (
                  <li
                    key={blocker.key}
                    className="rounded-lg border border-red-200 bg-white p-3"
                  >
                    <p className="font-semibold">{blocker.label}</p>

                    <p className="mt-1 text-sm">{blocker.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Event type *
            </span>

            <select
              value={form.eventType}
              onChange={(event) => handleEventTypeChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="STATUS_CHANGED">Status changed</option>

              <option value="LOCATION_UPDATE">Location update</option>

              <option value="DOCUMENT_UPLOADED">Document uploaded</option>

              <option value="NOTE_ADDED">Note added</option>

              <option value="CREATED">Shipment created</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Shipment status
              {form.eventType === "STATUS_CHANGED" ? " *" : ""}
            </span>

            <select
              value={form.status}
              disabled={form.eventType !== "STATUS_CHANGED"}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "no-status"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Title *</span>

          <input
            type="text"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="For example: Vehicle received at Hamburg Port"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Location</span>

          <input
            type="text"
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="For example: Hamburg Port, Germany"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">
            Description
          </span>

          <textarea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            rows={4}
            placeholder="Add more information about this tracking event."
            className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create Tracking Event"}
        </button>
      </form>
    </section>
  );
}
