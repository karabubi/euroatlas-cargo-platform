"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type NotificationChannel = "EMAIL" | "WHATSAPP";

type NotificationDeliveryStatus = "SENT" | "FAILED";

type ShipmentNotificationHistoryItem = {
  id: string;
  shipmentId: string;
  channel: NotificationChannel;
  recipient: string;
  notificationType: string;
  shipmentStatus: string;
  deliveryStatus: NotificationDeliveryStatus;
  provider: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
};

type ShipmentNotificationHistoryProps = {
  shipmentId: string;
  refreshKey?: number;
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function deliveryBadgeClass(status: NotificationDeliveryStatus): string {
  return status === "SENT"
    ? "bg-emerald-100 text-emerald-800"
    : "bg-red-100 text-red-800";
}

function channelBadgeClass(channel: NotificationChannel): string {
  return channel === "EMAIL"
    ? "bg-sky-100 text-sky-800"
    : "bg-emerald-100 text-emerald-800";
}

export function ShipmentNotificationHistory({
  shipmentId,
  refreshKey = 0,
}: ShipmentNotificationHistoryProps) {
  const [items, setItems] = useState<ShipmentNotificationHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFetch<ShipmentNotificationHistoryItem[]>(
        `/shipments/${shipmentId}/notifications`,
      );

      setItems(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Notification history could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadHistory, refreshKey]);

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">
            Communication
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Notification History
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Customer tracking messages sent for this shipment.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          disabled={isLoading}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          {error}
        </div>
      ) : null}

      {!error && isLoading && items.length === 0 ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          Loading notification history...
        </div>
      ) : null}

      {!error && !isLoading && items.length === 0 ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5">
          <p className="font-semibold text-slate-800">No notifications yet.</p>

          <p className="mt-1 text-sm text-slate-600">
            When the admin sends a tracking email, the result will appear here.
          </p>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${channelBadgeClass(
                        item.channel,
                      )}`}
                    >
                      {item.channel}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${deliveryBadgeClass(
                        item.deliveryStatus,
                      )}`}
                    >
                      {item.deliveryStatus}
                    </span>

                    <span className="text-xs font-semibold text-slate-500">
                      {formatStatus(item.shipmentStatus)}
                    </span>
                  </div>

                  <p className="mt-3 break-all font-semibold text-slate-900">
                    {item.recipient}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
                    <span>
                      Type:{" "}
                      <strong className="text-slate-800">
                        {formatStatus(item.notificationType)}
                      </strong>
                    </span>

                    <span>
                      Provider:{" "}
                      <strong className="text-slate-800">
                        {item.provider}
                      </strong>
                    </span>
                  </div>

                  {item.errorMessage ? (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {item.errorMessage}
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 text-sm text-slate-500 lg:text-right">
                  <p>{item.deliveryStatus === "SENT" ? "Sent" : "Attempted"}</p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {formatDateTime(item.sentAt ?? item.createdAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
