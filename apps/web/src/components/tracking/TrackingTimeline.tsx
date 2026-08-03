'use client';

import type { TrackingEvent } from '@/types/tracking';

type TrackingTimelineProps = {
  events: TrackingEvent[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatEventType(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

export default function TrackingTimeline({
  events,
}: TrackingTimelineProps) {
  if (events.length === 0) {
    return (
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">
          Tracking Timeline
        </h2>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-semibold text-slate-700">
            No tracking events available
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Create the first tracking event using the form
            above.
          </p>
        </div>
      </section>
    );
  }

  const sortedEvents = [...events].sort(
    (first, second) =>
      new Date(second.createdAt).getTime() -
      new Date(first.createdAt).getTime(),
  );

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-sky-600">
          Event history
        </p>

        <h2 className="mt-2 text-xl font-bold text-slate-950">
          Tracking Timeline
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Complete history of shipment tracking updates.
        </p>
      </div>

      <div className="mt-8 space-y-0">
        {sortedEvents.map((event, index) => (
          <article
            key={event.id}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {index < sortedEvents.length - 1 && (
              <div className="absolute left-[17px] top-9 h-[calc(100%-18px)] w-0.5 bg-slate-200" />
            )}

            <div className="relative z-10 mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <span className="h-3 w-3 rounded-full bg-sky-600" />
            </div>

            <div className="min-w-0 flex-1 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-slate-950">
                    {event.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(event.createdAt)}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  {formatEventType(event.eventType)}
                </span>
              </div>

              {event.status && (
                <div className="mt-4">
                  <span className="text-sm font-semibold text-slate-500">
                    Status:{' '}
                  </span>

                  <span className="text-sm text-slate-700">
                    {formatEventType(event.status)}
                  </span>
                </div>
              )}

              {event.location && (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold">
                    Location:
                  </span>{' '}
                  {event.location}
                </p>
              )}

              {event.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {event.description}
                </p>
              )}

              {event.createdBy && (
                <p className="mt-3 text-xs text-slate-500">
                  Added by {event.createdBy}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
