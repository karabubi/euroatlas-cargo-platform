"use client";

import Link from "next/link";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";
import {
  formatShipmentStatus,
  shipmentStatusBadgeClass,
} from "@/lib/shipment-status-ui";
import type { ShipmentStatus } from "@/types/shipment";
import { TrackShipmentButton } from "@/components/shipment/track-shipment-button";

type Customer = {
  id: string;
  customerNo: string;
  companyName?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type Shipment = {
  id: string;
  shipmentNo: string;
  customerId: string;
  bookingReference?: string | null;
  containerNumber?: string | null;
  originCountry?: string | null;
  originCity?: string | null;
  destinationCountry?: string | null;
  destinationCity?: string | null;
  status: ShipmentStatus;
  estimatedDeparture?: string | null;
  actualDeparture?: string | null;
  estimatedArrival?: string | null;
  actualArrival?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
};

type ShipmentForm = {
  shipmentNo: string;
  customerId: string;
  bookingReference: string;
  containerNumber: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  status: string;
  estimatedDeparture: string;
  actualDeparture: string;
  estimatedArrival: string;
  actualArrival: string;
};

const initialForm: ShipmentForm = {
  shipmentNo: "",
  customerId: "",
  bookingReference: "",
  containerNumber: "",
  originCountry: "",
  originCity: "",
  destinationCountry: "",
  destinationCity: "",
  status: "DRAFT",
  estimatedDeparture: "",
  actualDeparture: "",
  estimatedArrival: "",
  actualArrival: "",
};

function getCustomerName(customer: Customer) {
  if (customer.companyName?.trim()) {
    return customer.companyName;
  }

  return `${customer.firstName} ${customer.lastName}`.trim();
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function toDateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function dateToIso(value: string) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState<ShipmentForm>(initialForm);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [shipmentToDelete, setShipmentToDelete] = useState<Shipment | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadShipments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter.trim()) {
        params.set("status", statusFilter.trim());
      }

      const query = params.toString();
      const data = await apiFetch<Shipment[]>(
        `/shipments${query ? `?${query}` : ""}`,
      );

      setShipments(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Shipments could not be loaded."));
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchCustomers() {
      try {
        const data = await apiFetch<Customer[]>("/customers");

        if (isCancelled) {
          return;
        }

        setCustomers(data);

        setForm((current) => {
          if (current.customerId || data.length === 0) {
            return current;
          }

          return {
            ...current,
            customerId: data[0].id,
          };
        });
      } catch (requestError) {
        if (isCancelled) {
          return;
        }

        setError(
          getErrorMessage(requestError, "Customers could not be loaded."),
        );
      }
    }

    void fetchCustomers();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadShipments();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadShipments]);

  const customerOptions = useMemo(
    () =>
      customers.map((customer) => ({
        value: customer.id,
        label: `${customer.customerNo} — ${getCustomerName(customer)}`,
      })),
    [customers],
  );

  function resetForm() {
    setEditingShipment(null);
    setForm({
      ...initialForm,
      customerId: customers[0]?.id ?? "",
    });
  }

  async function openCreateForm() {
    setError("");
    setSuccess("");
    resetForm();

    try {
      const preview = await apiFetch<{
        shipmentNo: string;
      }>("/shipments/next-number");

      setForm((current) => ({
        ...current,
        shipmentNo: preview.shipmentNo,
      }));
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "The next shipment number could not be loaded.",
        ),
      );
    }

    document
      .getElementById("shipment-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function openEditForm(shipment: Shipment) {
    setEditingShipment(shipment);
    setSuccess("");
    setError("");

    setForm({
      shipmentNo: shipment.shipmentNo,
      customerId: shipment.customerId,
      bookingReference: shipment.bookingReference ?? "",
      containerNumber: shipment.containerNumber ?? "",
      originCountry: shipment.originCountry ?? "",
      originCity: shipment.originCity ?? "",
      destinationCountry: shipment.destinationCountry ?? "",
      destinationCity: shipment.destinationCity ?? "",
      status: shipment.status ?? "DRAFT",
      estimatedDeparture: toDateInput(shipment.estimatedDeparture),
      actualDeparture: toDateInput(shipment.actualDeparture),
      estimatedArrival: toDateInput(shipment.estimatedArrival),
      actualArrival: toDateInput(shipment.actualArrival),
    });

    document
      .getElementById("shipment-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function updateForm<K extends keyof ShipmentForm>(
    field: K,
    value: ShipmentForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.customerId) {
      setError("Please select a customer.");
      return;
    }

    setIsSaving(true);

    const payload = {
      customerId: form.customerId,
      bookingReference: form.bookingReference.trim() || undefined,
      containerNumber: form.containerNumber.trim() || undefined,
      originCountry: form.originCountry.trim(),
      originCity: form.originCity.trim() || undefined,
      destinationCountry: form.destinationCountry.trim(),
      destinationCity: form.destinationCity.trim() || undefined,
      ...(!editingShipment ? { status: form.status.trim() || "DRAFT" } : {}),
      estimatedDeparture: dateToIso(form.estimatedDeparture),
      actualDeparture: dateToIso(form.actualDeparture),
      estimatedArrival: dateToIso(form.estimatedArrival),
      actualArrival: dateToIso(form.actualArrival),
    };

    try {
      if (editingShipment) {
        await apiFetch<Shipment>(`/shipments/${editingShipment.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        setSuccess(`Shipment ${form.shipmentNo} was updated successfully.`);
      } else {
        const createdShipment = await apiFetch<Shipment>(
          "/shipments",
          {
            method: "POST",
            body: JSON.stringify(payload),
          },
        );

        setSuccess(
          `Shipment ${createdShipment.shipmentNo} was created successfully.`,
        );
      }

      resetForm();
      await loadShipments();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "The shipment could not be saved."),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!shipmentToDelete) {
      return;
    }

    setIsDeleting(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch<Shipment>(`/shipments/${shipmentToDelete.id}`, {
        method: "DELETE",
      });

      setSuccess(
        `Shipment ${shipmentToDelete.shipmentNo} was deleted successfully.`,
      );

      setShipmentToDelete(null);
      await loadShipments();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "The shipment could not be deleted."),
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <main className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Logistics
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">Shipments</h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Create, update, search and manage cargo shipments.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Add shipment
        </button>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <section
        id="shipment-form"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-950">
            {editingShipment ? "Edit shipment" : "Create shipment"}
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Fields marked with an asterisk are required.
          </p>
        </div>

        {customers.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You must create at least one customer before creating a shipment.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Shipment number
                </span>
                <input
                  value={
                    form.shipmentNo ||
                    "Generated automatically"
                  }
                  readOnly
                  aria-readonly="true"
                  className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                />
                <span className="block text-xs text-slate-500">
                  {editingShipment
                    ? "System generated — this number cannot be changed."
                    : "Generated automatically by EuroAtlas Cargo."}
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Customer *
                </span>

                <select
                  required
                  value={form.customerId}
                  onChange={(event) =>
                    updateForm("customerId", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                >
                  <option value="">Select customer</option>

                  {customerOptions.map((customer) => (
                    <option key={customer.value} value={customer.value}>
                      {customer.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Booking reference
                </span>

                <input
                  value={form.bookingReference}
                  onChange={(event) =>
                    updateForm("bookingReference", event.target.value)
                  }
                  placeholder="BOOK-123456"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Container number
                </span>

                <input
                  value={form.containerNumber}
                  onChange={(event) =>
                    updateForm("containerNumber", event.target.value)
                  }
                  placeholder="MSCU1234567"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Origin country *
                </span>

                <input
                  required
                  maxLength={100}
                  value={form.originCountry}
                  onChange={(event) =>
                    updateForm("originCountry", event.target.value)
                  }
                  placeholder="Germany"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Origin city
                </span>

                <input
                  maxLength={100}
                  value={form.originCity}
                  onChange={(event) =>
                    updateForm("originCity", event.target.value)
                  }
                  placeholder="Hamburg"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Destination country *
                </span>

                <input
                  required
                  maxLength={100}
                  value={form.destinationCountry}
                  onChange={(event) =>
                    updateForm("destinationCountry", event.target.value)
                  }
                  placeholder="Libya"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Destination city
                </span>

                <input
                  value={form.destinationCity}
                  onChange={(event) =>
                    updateForm("destinationCity", event.target.value)
                  }
                  placeholder="Tripoli"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Status
                </span>

                <input
                  value={form.status}
                  disabled={Boolean(editingShipment)}
                  onChange={(event) =>
                    updateForm("status", event.target.value.toUpperCase())
                  }
                  placeholder="DRAFT"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-950"
                />

                <span className="block text-xs text-slate-500">
                  {editingShipment
                    ? "Status changes use the controlled shipment workflow."
                    : "New shipments start in the selected pre-operational status."}
                </span>
              </label>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
                Shipment dates
              </h3>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Estimated departure
                  </span>

                  <input
                    type="date"
                    value={form.estimatedDeparture}
                    onChange={(event) =>
                      updateForm("estimatedDeparture", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Actual departure
                  </span>

                  <input
                    type="date"
                    value={form.actualDeparture}
                    onChange={(event) =>
                      updateForm("actualDeparture", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Estimated arrival
                  </span>

                  <input
                    type="date"
                    value={form.estimatedArrival}
                    onChange={(event) =>
                      updateForm("estimatedArrival", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Actual arrival
                  </span>

                  <input
                    type="date"
                    value={form.actualArrival}
                    onChange={(event) =>
                      updateForm("actualArrival", event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving
                  ? "Saving..."
                  : editingShipment
                    ? "Update shipment"
                    : "Create shipment"}
              </button>

              {editingShipment ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel editing
                </button>
              ) : null}
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 md:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Shipment records
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {shipments.length} shipment
                {shipments.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Search
                </span>

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Number, container or destination"
                  className="w-full min-w-64 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </span>

                <input
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value.toUpperCase())
                  }
                  placeholder="All statuses"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-slate-950"
                />
              </label>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-600">
            Loading shipments...
          </div>
        ) : shipments.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-bold text-slate-950">No shipments found</h3>

            <p className="mt-2 text-sm text-slate-600">
              Create your first shipment or change the search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Shipment",
                    "Customer",
                    "Container",
                    "Destination",
                    "Status",
                    "Departure",
                    "Arrival",
                    "Actions",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="space-y-2">
                        <p className="font-bold text-slate-950">
                          {shipment.shipmentNo}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/dashboard/shipments/${shipment.id}`}
                            className="inline-flex rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                          >
                            View details & upload
                          </Link>

                          <TrackShipmentButton
                            shipmentNo={shipment.shipmentNo}
                          />
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {shipment.bookingReference || "No booking reference"}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {getCustomerName(shipment.customer)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {shipment.containerNumber || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {[shipment.destinationCity, shipment.destinationCountry]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${shipmentStatusBadgeClass(
                          shipment.status,
                        )}`}
                      >
                        {formatShipmentStatus(shipment.status)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatDate(
                        shipment.actualDeparture ?? shipment.estimatedDeparture,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                      {formatDate(
                        shipment.actualArrival ?? shipment.estimatedArrival,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(shipment)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setShipmentToDelete(shipment)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {shipmentToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-950">
              Delete shipment
            </h2>

            <p className="mt-3 text-sm text-slate-600">
              Are you sure you want to delete shipment{" "}
              <strong>{shipmentToDelete.shipmentNo}</strong>? This action cannot
              be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShipmentToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete shipment"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
