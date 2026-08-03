type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditVehiclePage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold text-slate-900">
        Edit Vehicle
      </h1>

      <p className="mt-4 text-slate-600">
        Editing Vehicle: {id}
      </p>
    </main>
  );
}
