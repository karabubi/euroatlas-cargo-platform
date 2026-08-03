export default function ShipmentsPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">
        Shipments
      </h1>

      <p className="mt-2 text-slate-600">
        Create and track vehicle and container
        shipments.
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          No shipments yet
        </h2>

        <p className="mt-2 text-slate-500">
          Shipment creation will be connected after
          the shipment backend module is ready.
        </p>
      </div>
    </section>
  );
}