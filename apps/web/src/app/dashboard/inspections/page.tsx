"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  downloadVehicleInspectionPdf,
  getAllVehicleInspections,
} from "@/lib/vehicle-inspections-api";

import type {
  DamageSeverity,
  InspectionApprovalStatus,
  InspectionCondition,
  InspectionStatus,
  InspectionType,
  VehicleInspection,
  VehicleInspectionDashboardResponse,
} from "@/types/vehicle-inspection";

import {
  damageSeverityOptions,
  formatInspectionValue,
  inspectionApprovalStatusOptions,
  inspectionConditionOptions,
  inspectionStatusOptions,
  inspectionTypeOptions,
} from "@/types/vehicle-inspection";

const EMPTY_RESPONSE: VehicleInspectionDashboardResponse = {
  data: [],
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  },
  statistics: {
    total: 0,
    completed: 0,
    inProgress: 0,
    withDamage: 0,
    totalDamageReports: 0,
  },
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClasses(status: InspectionStatus): string {
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

function approvalClasses(status: VehicleInspection["approvalStatus"]): string {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 ring-red-200";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-200";
  }
}

export default function InspectionsDashboardPage() {
  const [response, setResponse] =
    useState<VehicleInspectionDashboardResponse>(EMPTY_RESPONSE);

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [type, setType] = useState<InspectionType | "">("");

  const [status, setStatus] = useState<InspectionStatus | "">("");

  const [approvalStatus, setApprovalStatus] = useState<
    InspectionApprovalStatus | ""
  >("");

  const [condition, setCondition] = useState<InspectionCondition | "">("");

  const [damageSeverity, setDamageSeverity] = useState<DamageSeverity | "">("");

  const [damageFilter, setDamageFilter] = useState<"ALL" | "YES" | "NO">("ALL");

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");

  const loadInspections = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      try {
        const result = await getAllVehicleInspections({
          search: search || undefined,
          type: type || undefined,
          status: status || undefined,
          approvalStatus: approvalStatus || undefined,
          condition: condition || undefined,
          damageSeverity: damageSeverity || undefined,
          hasVisibleDamage:
            damageFilter === "ALL" ? undefined : damageFilter === "YES",
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          pageSize,
        });

        setResponse(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Inspections could not be loaded.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      condition,
      damageFilter,
      damageSeverity,
      dateFrom,
      dateTo,
      page,
      pageSize,
      search,
      approvalStatus,
      status,
      type,
    ],
  );

  useEffect(() => {
    // Synchronize dashboard filters with the API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadInspections();
  }, [loadInspections]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setType("");
    setStatus("");
    setApprovalStatus("");
    setCondition("");
    setDamageSeverity("");
    setDamageFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setPageSize(10);
  }

  async function handleDownload(inspection: VehicleInspection) {
    setDownloadingId(inspection.id);
    setErrorMessage("");

    try {
      await downloadVehicleInspectionPdf(
        inspection.id,
        inspection.inspectionNo,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "PDF could not be downloaded.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  const { data: inspections, pagination, statistics } = response;

  return (
    <main className="min-h-screen bg-slate-100 p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm md:p-9">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">
                Vehicle Operations
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                Inspection Dashboard
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Search, filter and manage vehicle inspections and damage
                reports.
              </p>
            </div>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => void loadInspections(true)}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>
          </div>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatisticCard label="Total inspections" value={statistics.total} />

          <StatisticCard label="Completed" value={statistics.completed} />

          <StatisticCard label="In progress" value={statistics.inProgress} />

          <StatisticCard label="With damage" value={statistics.withDamage} />

          <StatisticCard
            label="Damage reports"
            value={statistics.totalDamageReports}
          />
        </section>

        <section className="mt-7 rounded-3xl bg-white p-6 shadow-sm">
          <form onSubmit={handleSearch} className="grid gap-4">
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Inspection no., vehicle, VIN, inspector or location"
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
              />

              <button
                type="submit"
                className="rounded-xl bg-sky-600 px-6 py-3 font-semibold text-white hover:bg-sky-700"
              >
                Search
              </button>

              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Reset
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FilterSelect
                value={type}
                onChange={(value) => {
                  setPage(1);
                  setType(value as InspectionType | "");
                }}
                label="Inspection type"
                options={inspectionTypeOptions}
              />

              <FilterSelect
                value={status}
                onChange={(value) => {
                  setPage(1);
                  setStatus(value as InspectionStatus | "");
                }}
                label="Status"
                options={inspectionStatusOptions}
              />

              <FilterSelect
                value={approvalStatus}
                onChange={(value) => {
                  setPage(1);
                  setApprovalStatus(value as InspectionApprovalStatus | "");
                }}
                label="Approval status"
                options={inspectionApprovalStatusOptions}
              />

              <FilterSelect
                value={condition}
                onChange={(value) => {
                  setPage(1);
                  setCondition(value as InspectionCondition | "");
                }}
                label="Condition"
                options={inspectionConditionOptions}
              />

              <FilterSelect
                value={damageSeverity}
                onChange={(value) => {
                  setPage(1);
                  setDamageSeverity(value as DamageSeverity | "");
                }}
                label="Damage severity"
                options={damageSeverityOptions}
              />

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Visible damage
                <select
                  value={damageFilter}
                  onChange={(event) => {
                    setPage(1);
                    setDamageFilter(event.target.value as "ALL" | "YES" | "NO");
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                >
                  <option value="ALL">All</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Date from
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setPage(1);
                    setDateFrom(event.target.value);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Date to
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setPage(1);
                    setDateTo(event.target.value);
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Results per page
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPage(1);
                    setPageSize(Number(event.target.value));
                  }}
                  className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </form>
        </section>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="mt-7 overflow-hidden rounded-3xl bg-white shadow-sm">
          {isLoading ? (
            <div className="p-10 text-slate-600">Loading inspections...</div>
          ) : inspections.length === 0 ? (
            <div className="p-14 text-center">
              <h2 className="text-xl font-bold text-slate-900">
                No inspections found
              </h2>
              <p className="mt-2 text-slate-500">
                Change the filters or create a new vehicle inspection.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-4">Inspection</th>
                    <th className="px-6 py-4">Vehicle</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Approval</th>
                    <th className="px-6 py-4">Inspector</th>
                    <th className="px-6 py-4">Damage</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {inspections.map((inspection) => (
                    <tr
                      key={inspection.id}
                      className="align-top hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-950">
                          {inspection.inspectionNo}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatInspectionValue(inspection.type)}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <Link
                          href={`/dashboard/vehicles/${inspection.vehicleId}`}
                          className="font-semibold text-sky-700 hover:underline"
                        >
                          {inspection.vehicle.vehicleNo}
                        </Link>

                        <p className="mt-1 text-sm text-slate-600">
                          {inspection.vehicle.make} {inspection.vehicle.model}
                        </p>

                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {inspection.vehicle.vin || "No VIN"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusClasses(
                            inspection.status,
                          )}`}
                        >
                          {formatInspectionValue(inspection.status)}
                        </span>

                        {inspection.condition ? (
                          <p className="mt-2 text-sm text-slate-600">
                            {formatInspectionValue(inspection.condition)}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${approvalClasses(
                            inspection.approvalStatus,
                          )}`}
                        >
                          {formatInspectionValue(inspection.approvalStatus)}
                        </span>

                        {inspection.approvalStatus === "APPROVED" ? (
                          <div className="mt-2 text-xs text-slate-500">
                            <p>By: {inspection.approvedBy || "—"}</p>
                            {inspection.approvedAt ? (
                              <p className="mt-1">
                                {formatDate(inspection.approvedAt)}
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        {inspection.approvalStatus === "REJECTED" ? (
                          <div className="mt-2 text-xs text-slate-500">
                            <p>By: {inspection.rejectedBy || "—"}</p>
                            {inspection.rejectedAt ? (
                              <p className="mt-1">
                                {formatDate(inspection.rejectedAt)}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        <p>{inspection.inspectorName || "—"}</p>
                        <p className="mt-1 text-slate-500">
                          {inspection.location || "—"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <p
                          className={
                            inspection.hasVisibleDamage
                              ? "font-bold text-red-700"
                              : "font-semibold text-emerald-700"
                          }
                        >
                          {inspection.hasVisibleDamage
                            ? "Visible damage"
                            : "No visible damage"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {inspection.damageReports.length} reports
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-6 py-5 text-sm text-slate-600">
                        {formatDate(inspection.inspectionDate)}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex min-w-36 flex-col gap-2">
                          <Link
                            href={`/dashboard/inspections/${inspection.id}`}
                            className="rounded-lg bg-slate-950 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                          >
                            View Inspection
                          </Link>

                          <Link
                            href={`/dashboard/vehicles/${inspection.vehicleId}`}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            View Vehicle
                          </Link>

                          <button
                            type="button"
                            disabled={downloadingId === inspection.id}
                            onClick={() => void handleDownload(inspection)}
                            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {downloadingId === inspection.id
                              ? "Downloading..."
                              : "Download PDF"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex flex-col justify-between gap-4 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} inspections
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={!pagination.hasPreviousPage || isLoading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-slate-300 px-5 py-2 font-semibold text-slate-700 disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isLoading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-xl bg-slate-950 px-5 py-2 font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

type StatisticCardProps = {
  label: string;
  value: number;
};

function StatisticCard({ label, value }: StatisticCardProps) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
    </article>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: {
    value: string;
    label: string;
  }[];
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-xl border border-slate-300 px-4 py-3 font-normal"
      >
        <option value="">All</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
