type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShipmentDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-4xl font-bold">
        Shipment #{id}
      </h1>

      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">
          Shipment Information
        </h2>

        <p className="mt-4 text-slate-600">
          This page will soon display:
        </p>

        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>Shipment information</li>
          <li>Customer information</li>
          <li>Vehicle assignment</li>
          <li>Driver assignment</li>
          <li>Tracking timeline</li>
          <li>Documents</li>
        </ul>
      </div>
    </main>
  );
}
