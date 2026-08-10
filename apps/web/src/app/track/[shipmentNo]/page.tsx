"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TrackingEvent = {
  eventType: string;
  status: string | null;
  title: string;
  description: string | null;
  location: string | null;
  createdAt: string;
};

type TrackingResult = {
  shipmentNo: string;
  status: string;

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

  tracking: TrackingEvent[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function humanizeStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ShipmentTrackingPage() {
  const params = useParams<{
    shipmentNo: string;
  }>();

  const shipmentNo = useMemo(
    () => decodeURIComponent(params.shipmentNo ?? ""),
    [params.shipmentNo],
  );

  const [data, setData] = useState<TrackingResult | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/tracking/public/${encodeURIComponent(shipmentNo)}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Shipment not found."
              : "Unable to load shipment tracking.",
          );
        }

        const result = (await response.json()) as TrackingResult;

        if (active) {
          setData(result);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load shipment tracking.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (shipmentNo) {
      void load();
    }

    return () => {
      active = false;
    };
  }, [shipmentNo]);

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p>Loading tracking information…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <section className="rounded-2xl border p-8">
          <h1 className="text-2xl font-bold">Tracking unavailable</h1>

          <p className="mt-3 text-gray-600">
            {error || "Shipment tracking information is unavailable."}
          </p>

          <Link
            href="/track"
            className="mt-6 inline-block font-semibold underline"
          >
            Try another shipment number
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/track" className="text-sm font-semibold underline">
        ← Track another shipment
      </Link>

      <section className="mt-6 rounded-2xl border bg-white p-8 text-slate-900 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <p className="text-sm text-slate-600">Shipment</p>

            <h1 className="text-3xl font-bold">{data.shipmentNo}</h1>
          </div>

          <div>
            <p className="text-sm text-slate-600">Current status</p>

            <p className="text-xl font-semibold">
              {humanizeStatus(data.status)}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-600">Origin</p>

            <p className="font-medium">
              {[data.originCity, data.originPort, data.originCountry]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-600">Destination</p>

            <p className="font-medium">
              {[
                data.destinationCity,
                data.destinationPort,
                data.destinationCountry,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm text-slate-600">Shipping line</p>
            <p>{data.shippingLine || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600">Vessel</p>
            <p>{data.vesselName || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600">Container</p>
            <p>{data.containerNumber || "—"}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600">Booking reference</p>
            <p>{data.bookingReference || "—"}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-600">Departure</p>

            <p>{formatDate(data.actualDeparture ?? data.estimatedDeparture)}</p>
          </div>

          <div>
            <p className="text-sm text-slate-600">Arrival</p>

            <p>{formatDate(data.actualArrival ?? data.estimatedArrival)}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Tracking history</h2>

        <div className="mt-5 space-y-4">
          {data.tracking.length === 0 ? (
            <div className="rounded-xl border p-5 text-gray-600">
              No tracking events are available yet.
            </div>
          ) : (
            data.tracking.map((event, index) => (
              <article
                key={`${event.createdAt}-${index}`}
                className="rounded-xl border bg-white p-5 text-slate-900"
              >
                <div className="flex flex-col justify-between gap-2 sm:flex-row">
                  <div>
                    <h3 className="font-semibold">{event.title}</h3>

                    {event.status ? (
                      <p className="text-sm text-slate-600">
                        {humanizeStatus(event.status)}
                      </p>
                    ) : null}
                  </div>

                  <time className="text-sm text-slate-600">
                    {formatDate(event.createdAt)}
                  </time>
                </div>

                {event.description ? (
                  <p className="mt-3 text-slate-700">{event.description}</p>
                ) : null}

                {event.location ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Location: {event.location}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
