import { redirect } from 'next/navigation';

export default function ShipmentsRedirectPage() {
  redirect('/dashboard/shipments');
}
