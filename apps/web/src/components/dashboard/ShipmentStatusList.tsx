type ShipmentStatus = {
  status: string;
  total: number;
};

type ShipmentStatusListProps = {
  statuses: ShipmentStatus[];
  totalShipments: number;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export function ShipmentStatusList({
  statuses,
  totalShipments,
}: ShipmentStatusListProps) {
  if (statuses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="font-semibold text-slate-700">
          No shipment status data yet
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Create your first shipment to see status analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {statuses.map((item) => {
        const percentage =
          totalShipments > 0
            ? Math.round(
                (item.total / totalShipments) * 100,
              )
            : 0;

        return (
          <div key={item.status}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">
                  {formatStatus(item.status)}
                </p>

                <p className="text-sm text-slate-500">
                  {item.total}{' '}
                  {item.total === 1
                    ? 'shipment'
                    : 'shipments'}
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                {percentage}%
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-600 transition-all"
                style={{
                  width: `${percentage}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
