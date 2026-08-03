import { redirect } from 'next/navigation';

interface VehicleRedirectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VehicleRedirectPage({
  params,
}: VehicleRedirectPageProps) {
  const { id } = await params;

  redirect(`/dashboard/vehicles/${id}`);
}
