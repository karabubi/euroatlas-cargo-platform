import { redirect } from 'next/navigation';

export default function NewVehicleRedirectPage() {
  redirect('/dashboard/vehicles/new');
}
