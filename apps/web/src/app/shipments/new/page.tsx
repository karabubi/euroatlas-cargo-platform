import { redirect } from 'next/navigation';

export default function NewShipmentRedirectPage() {
  redirect('/dashboard/shipments');
}
