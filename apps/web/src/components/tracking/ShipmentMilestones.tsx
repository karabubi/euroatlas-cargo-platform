'use client';

import type { TrackingEvent } from '@/types/tracking';

type ShipmentMilestonesProps = {
  events: TrackingEvent[];
};

type Milestone = {
  status: string;
  label: string;
  description: string;
};

const milestones: Milestone[] = [
  {
    status: 'BOOKED',
    label: 'Booking confirmed',
    description:
      'The shipping booking has been confirmed.',
  },
  {
    status: 'RECEIVED',
    label: 'Vehicle received',
    description:
      'The vehicle or cargo has been received.',
  },
  {
    status: 'CUSTOMS_CLEARANCE',
    label: 'Customs processing',
    description:
      'Export customs processing is underway.',
  },
  {
    status: 'LOADED',
    label: 'Loaded',
    description:
      'The cargo has been loaded for transport.',
  },
  {
    status: 'IN_TRANSIT',
    label: 'In transit',
    description:
      'The shipment is currently in transit.',
  },
  {
    status: 'ARRIVED',
    label: 'Arrived',
    description:
      'The shipment has arrived at its destination.',
  },
  {
    status: 'READY_FOR_DELIVERY',
    label: 'Ready for delivery',
    description:
      'The shipment is ready for final delivery.',
  },
  {
    status: 'DELIVERED',
    label: 'Delivered',
    description:
      'The shipment has been delivered successfully.',
  },
];

function normalizeValue(
  value?: string | null,
) {
  return value?.trim().toUpperCase() ?? '';
}

function findMilestoneEvent(
  milestone: Milestone,
  events: TrackingEvent[],
) {
  return events.find(
    (event) =>
      normalizeValue(event.status) ===
      milestone.status,
  );
}

function formatMilestoneDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function ShipmentMilestones({
  events,
}: ShipmentMilestonesProps) {
  const milestoneResults = milestones.map(
    (milestone) => ({
      milestone,
      event: findMilestoneEvent(
        milestone,
        events,
      ),
    }),
  );

  const completedIndexes =
    milestoneResults
      .map((result, index) =>
        result.event ? index : -1,
      )
      .filter((index) => index >= 0);

  const currentMilestoneIndex =
    completedIndexes.length > 0
      ? Math.max(...completedIndexes)
      : -1;

  /*
   * When a later status is reached, all earlier
   * workflow steps are treated as completed.
   */
  const completedCount =
    currentMilestoneIndex >= 0
      ? currentMilestoneIndex + 1
      : 0;

  const progressPercentage = Math.round(
    (completedCount / milestones.length) *
      100,
  );

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
            Shipment progress
          </p>

          <h2 className="mt-2 text-xl font-bold text-slate-950">
            Shipping Milestones
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Follow the shipment from booking to
            final delivery.
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-950">
            {progressPercentage}%
          </p>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Completed
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-sky-600 transition-all"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {completedCount} of{' '}
          {milestones.length} milestones
          completed
        </p>
      </div>

      <div className="mt-8 space-y-0">
        {milestoneResults.map(
          ({ milestone, event }, index) => {
            const isCompleted =
              index <= currentMilestoneIndex;

            const isCurrent =
              index === currentMilestoneIndex;

            return (
              <div
                key={milestone.status}
                className="relative flex gap-4 pb-8 last:pb-0"
              >
                {index <
                  milestones.length - 1 && (
                  <div
                    className={`absolute left-[17px] top-9 h-[calc(100%-18px)] w-0.5 ${
                      isCompleted
                        ? 'bg-sky-500'
                        : 'bg-slate-200'
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    isCompleted
                      ? 'border-sky-600 bg-sky-600 text-white'
                      : 'border-slate-300 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted
                    ? '✓'
                    : index + 1}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isCompleted
                          ? 'text-slate-950'
                          : 'text-slate-500'
                      }`}
                    >
                      {milestone.label}
                    </h3>

                    {isCurrent && (
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        Current
                      </span>
                    )}

                    {isCompleted &&
                      !isCurrent && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Completed
                        </span>
                      )}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {milestone.description}
                  </p>

                  {event && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="font-medium text-slate-700">
                        {event.title}
                      </p>

                      <p className="mt-1 text-slate-500">
                        {formatMilestoneDate(
                          event.createdAt,
                        )}
                      </p>

                      {event.location && (
                        <p className="mt-1 text-slate-600">
                          Location:{' '}
                          {event.location}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}
