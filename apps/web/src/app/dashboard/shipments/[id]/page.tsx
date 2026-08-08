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

        <Link
          href="/dashboard/shipments"
          className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Shipments
        </Link>
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
