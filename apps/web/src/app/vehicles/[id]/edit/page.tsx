import { redirect } from 'next/navigation';

interface VehicleEditRedirectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VehicleEditRedirectPage({
  params,
}: VehicleEditRedirectPageProps) {
  const { id } = await params;

  redirect(`/dashboard/vehicles/${id}/edit`);
}
