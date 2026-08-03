type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VehicleDetailsPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Vehicle Details
      </h1>

      <p className="mt-4 text-slate-600">
        Vehicle ID: {id}
      </p>
    </main>
  );
}
