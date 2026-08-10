"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TrackPage() {
  const router = useRouter();

  const [shipmentNo, setShipmentNo] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();

    const value = shipmentNo.trim();

    if (!value) {
      return;
    }

    router.push(`/track/${encodeURIComponent(value)}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <section className="rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          EuroAtlas Cargo
        </p>

        <h1 className="mt-2 text-3xl font-bold">Track your shipment</h1>

        <p className="mt-3 text-gray-600">
          Enter your shipment number to view the latest status and tracking
          history.
        </p>

        <form
          onSubmit={submit}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={shipmentNo}
            onChange={(event) => setShipmentNo(event.target.value)}
            placeholder="Example: EAC-2026-0001"
            autoComplete="off"
            required
            className="min-w-0 flex-1 rounded-xl border px-4 py-3 outline-none focus:ring-2"
          />

          <button
            type="submit"
            className="rounded-xl bg-black px-6 py-3 font-semibold text-white"
          >
            Track shipment
          </button>
        </form>
      </section>
    </main>
  );
}
