"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import ShipmentDocumentsPanel from "@/components/documents/ShipmentDocumentsPanel";
import ShipmentTrackingPanel from "@/components/tracking/ShipmentTrackingPanel";
import ShipmentReadinessPanel from "@/components/shipments/ShipmentReadinessPanel";
import { apiFetch } from "@/lib/api";
import {
  formatShipmentStatus,
  shipmentStatusBadgeClass,
} from "@/lib/shipment-status-ui";
import type { ShipmentStatus } from "@/types/shipment";
import { TrackShipmentButton } from "@/components/shipment/track-shipment-button";
import { ShipmentNotificationHistory } from "@/components/shipments/shipment-notification-history";

const isWhatsAppEnabled =
  process.env.NEXT_PUBLIC_WHATSAPP_ENABLED === "true";

type Customer = {
  id: string;
  customerNo: string;
  companyName: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
};

type Shipment = {
  id: string;
  shipmentNo: string;
  customerId: string;
  status: ShipmentStatus;

  originCountry: string;
  originCity: string | null;
  originPort: string | null;

  destinationCountry: string;
  destinationCity: string | null;
  destinationPort: string | null;

  bookingReference: string | null;
  containerNumber: string | null;
  shippingLine: string | null;
  vesselName: string | null;
  voyageNumber: string | null;

  estimatedDeparture: string | null;
  actualDeparture: string | null;
  estimatedArrival: string | null;
  actualArrival: string | null;

  description: string | null;
  notes: string | null;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  customer: Customer;
};

function displayValue(value: string | null | undefined) {
  return value?.trim() || "—";
}

function formatDate(value: string | null | undefined) {
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
  }).format(date);
}

function customerName(customer: Customer) {
  return customer.companyName || `${customer.firstName} ${customer.lastName}`;
}

export default function ShipmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const shipmentId = params.id;

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [notificationHistoryRefreshKey, setNotificationHistoryRefreshKey] =
    useState(0);

  const [sendingTrackingEmail, setSendingTrackingEmail] = useState(false);

  const [trackingEmailMessage, setTrackingEmailMessage] = useState<
    string | null
  >(null);

  const [trackingEmailError, setTrackingEmailError] = useState<string | null>(
    null,
  );

  const [sendingTrackingWhatsApp, setSendingTrackingWhatsApp] = useState(false);

  const [trackingWhatsAppMessage, setTrackingWhatsAppMessage] = useState<
    string | null
  >(null);

  const [trackingWhatsAppError, setTrackingWhatsAppError] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadShipment() {
      try {
        const data = await apiFetch<Shipment>(`/shipments/${shipmentId}`);

        if (!isCancelled) {
          setShipment(data);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "The shipment could not be loaded.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    if (shipmentId) {
      void loadShipment();
    }

    return () => {
      isCancelled = true;
    };
  }, [shipmentId]);

  async function handleSendTrackingWhatsApp() {
    if (!shipment) {
      return;
    }

    setSendingTrackingWhatsApp(true);
    setTrackingWhatsAppMessage(null);
    setTrackingWhatsAppError(null);

    try {
      const result = await apiFetch<{
        message: string;
        recipient: string;
        status: string;
      }>(`/shipments/${shipment.id}/notifications/whatsapp`, {
        method: "POST",
      });

      setTrackingWhatsAppMessage(
        result.message,
      );

      setNotificationHistoryRefreshKey((value) => value + 1);
    } catch (error) {
      setTrackingWhatsAppError(
        error instanceof Error
          ? error.message
          : "Tracking WhatsApp message could not be sent.",
      );
    } finally {
      setSendingTrackingWhatsApp(false);
    }
  }

  async function handleSendTrackingEmail() {
    if (!shipment) {
      return;
    }

    const customerEmail = shipment.customer.email?.trim();

    if (!customerEmail) {
      setTrackingEmailMessage(null);
      setTrackingEmailError(
        "This customer has no email address. Please add one in Customers before sending tracking updates.",
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      setTrackingEmailError(
        "Customer email address appears invalid. Please check and correct it.",
      );
      return;
    }


    setSendingTrackingEmail(true);
    setTrackingEmailMessage(null);
    setTrackingEmailError(null);

    try {
      const result = await apiFetch<{
        message: string;
        recipient: string;
        status: string;
      }>(`/shipments/${shipment.id}/notifications/email`, {
        method: "POST",
      });

      setTrackingEmailMessage(
        result.message,
      );

      setNotificationHistoryRefreshKey((value) => value + 1);
    } catch (error) {
      setTrackingEmailError(
        error instanceof Error
          ? error.message
          : "Tracking email could not be sent.",
      );
    } finally {
      setSendingTrackingEmail(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-slate-600">Loading shipment...</p>
      </section>
    );
  }

  if (error || !shipment) {
    return (
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error || "Shipment not found."}
        </div>

        <Link
          href="/dashboard/shipments"
          className="mt-6 inline-block rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white"
        >
          Back to Shipments
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Shipment details
          </p>

          <h1 className="mt-2 text-4xl font-bold text-slate-950">
            {shipment.shipmentNo}
          </h1>

          <p className="mt-2 text-slate-600">
            View the complete shipment information.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <TrackShipmentButton
              shipmentNo={shipment.shipmentNo}
              variant="primary"
            />

            <button
              type="button"
              onClick={handleSendTrackingEmail}
              disabled={sendingTrackingEmail}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingTrackingEmail ? "Sending..." : "Send Tracking Email"}
            </button>

            {isWhatsAppEnabled ? (
              <button
                type="button"
                onClick={handleSendTrackingWhatsApp}
                disabled={sendingTrackingWhatsApp}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingTrackingWhatsApp
                  ? "Sending WhatsApp..."
                  : "Send Tracking WhatsApp"}
              </button>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-800">
                WhatsApp notifications will be available soon.
              </div>
            )}

            <Link
              href="/dashboard/shipments"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Shipments
            </Link>
          </div>

          {trackingWhatsAppMessage ? (
            <div className="max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {trackingWhatsAppMessage}
            </div>
          ) : null}

          {trackingWhatsAppError ? (
            <div className="max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {trackingWhatsAppError}
            </div>
          ) : null}

          {trackingEmailMessage ? (
            <div className="max-w-xl rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
              {trackingEmailMessage}
            </div>
          ) : null}

          {trackingEmailError ? (
            <div className="max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
              {trackingEmailError}
            </div>
          ) : null}
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Status
          </p>

          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${shipmentStatusBadgeClass(
              shipment.status,
            )}`}
          >
            {formatShipmentStatus(shipment.status)}
          </span>
        </article>

        <SummaryCard label="Customer" value={customerName(shipment.customer)} />

        <SummaryCard label="Active" value={shipment.isActive ? "Yes" : "No"} />
      </section>

      <ShipmentTrackingPanel shipmentId={shipment.id} />

      <ShipmentNotificationHistory
        shipmentId={shipment.id}
        refreshKey={notificationHistoryRefreshKey}
      />

      <ShipmentReadinessPanel shipmentId={shipment.id} />

      <ShipmentDocumentsPanel shipmentId={shipment.id} />

      <DetailsSection title="Customer information">
        <DetailItem
          label="Customer number"
          value={shipment.customer.customerNo}
        />

        <DetailItem label="Customer" value={customerName(shipment.customer)} />

        <DetailItem
          label="Email"
          value={displayValue(shipment.customer.email)}
        />

        <DetailItem
          label="Phone"
          value={displayValue(shipment.customer.phone)}
        />
      </DetailsSection>

      <DetailsSection title="Route">
        <DetailItem label="Origin country" value={shipment.originCountry} />

        <DetailItem
          label="Origin city"
          value={displayValue(shipment.originCity)}
        />

        <DetailItem
          label="Origin port"
          value={displayValue(shipment.originPort)}
        />

        <DetailItem
          label="Destination country"
          value={shipment.destinationCountry}
        />

        <DetailItem
          label="Destination city"
          value={displayValue(shipment.destinationCity)}
        />

        <DetailItem
          label="Destination port"
          value={displayValue(shipment.destinationPort)}
        />
      </DetailsSection>

      <DetailsSection title="Shipping information">
        <DetailItem
          label="Booking reference"
          value={displayValue(shipment.bookingReference)}
        />

        <DetailItem
          label="Container number"
          value={displayValue(shipment.containerNumber)}
        />

        <DetailItem
          label="Shipping line"
          value={displayValue(shipment.shippingLine)}
        />

        <DetailItem
          label="Vessel name"
          value={displayValue(shipment.vesselName)}
        />

        <DetailItem
          label="Voyage number"
          value={displayValue(shipment.voyageNumber)}
        />
      </DetailsSection>

      <DetailsSection title="Shipment dates">
        <DetailItem
          label="Estimated departure"
          value={formatDate(shipment.estimatedDeparture)}
        />

        <DetailItem
          label="Actual departure"
          value={formatDate(shipment.actualDeparture)}
        />

        <DetailItem
          label="Estimated arrival"
          value={formatDate(shipment.estimatedArrival)}
        />

        <DetailItem
          label="Actual arrival"
          value={formatDate(shipment.actualArrival)}
        />
      </DetailsSection>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Additional information
        </h2>

        <div className="mt-6 space-y-6">
          <TextBlock
            label="Description"
            value={displayValue(shipment.description)}
          />

          <TextBlock label="Notes" value={displayValue(shipment.notes)} />
        </div>
      </section>

      <DetailsSection title="System information">
        <DetailItem label="Created" value={formatDate(shipment.createdAt)} />

        <DetailItem
          label="Last updated"
          value={formatDate(shipment.updatedAt)}
        />

        <DetailItem label="Shipment ID" value={shipment.id} />
      </DetailsSection>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <article className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-xl font-bold text-slate-950">{value}</p>
    </article>
  );
}

type DetailsSectionProps = {
  title: string;
  children: React.ReactNode;
};

function DetailsSection({ title, children }: DetailsSectionProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>

      <p className="mt-1 break-words text-slate-950">{value}</p>
    </div>
  );
}

type TextBlockProps = {
  label: string;
  value: string;
};

function TextBlock({ label, value }: TextBlockProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-500">{label}</p>

      <p className="mt-2 whitespace-pre-wrap text-slate-950">{value}</p>
    </div>
  );
}
