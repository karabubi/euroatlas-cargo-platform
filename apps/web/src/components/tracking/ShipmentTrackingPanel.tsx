'use client';

import { useEffect, useState } from 'react';

import AddTrackingEventForm from '@/components/tracking/AddTrackingEventForm';
import ShipmentMilestones from '@/components/tracking/ShipmentMilestones';
import TrackingTimeline from '@/components/tracking/TrackingTimeline';
import { getShipmentTracking } from '@/lib/tracking-api';
import type { TrackingEvent } from '@/types/tracking';

type ShipmentTrackingPanelProps = {
  shipmentId: string;
};

export default function ShipmentTrackingPanel({
  shipmentId,
}: ShipmentTrackingPanelProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadTracking(showLoader = true) {
    if (showLoader) {
      setIsLoading(true);
    }

    setError('');

    try {
      const data = await getShipmentTracking(shipmentId);
      setEvents(data.tracking);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The tracking information could not be loaded.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchTracking() {
      try {
        const data = await getShipmentTracking(shipmentId);

        if (!cancelled) {
          setEvents(data.tracking);
          setError('');
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'The tracking information could not be loaded.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchTracking();

    return () => {
      cancelled = true;
    };
  }, [shipmentId]);

  return (
    <div className="space-y-6">
      <AddTrackingEventForm
        shipmentId={shipmentId}
        onCreated={() => void loadTracking(false)}
      />

      {isLoading && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Shipment Tracking
          </h2>

          <p className="mt-4 text-slate-500">
            Loading tracking events...
          </p>
        </section>
      )}

      {!isLoading && error && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">
            Shipment Tracking
          </h2>

          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>

          <button
            type="button"
            onClick={() => void loadTracking()}
            className="mt-4 rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white"
          >
            Try Again
          </button>
        </section>
      )}

      {!isLoading && !error && (
        <>
          <ShipmentMilestones events={events} />
          <TrackingTimeline events={events} />
        </>
      )}
    </div>
  );
}
