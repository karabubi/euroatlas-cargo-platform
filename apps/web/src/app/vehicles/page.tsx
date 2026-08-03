import { redirect } from 'next/navigation';

export default function VehiclesRedirectPage() {
  redirect('/dashboard/vehicles');
}
