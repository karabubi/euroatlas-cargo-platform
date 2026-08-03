import Link from 'next/link';

const actions = [
  {
    title: 'New customer',
    description: 'Register a new cargo customer.',
    href: '/dashboard/customers',
    icon: '👤',
  },
  {
    title: 'New shipment',
    description: 'Create and manage a shipment.',
    href: '/dashboard/shipments',
    icon: '📦',
  },
  {
    title: 'Add vehicle',
    description: 'Register a vehicle in the fleet.',
    href: '/dashboard/vehicles/new',
    icon: '🚚',
  },
];

export function QuickActions() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.title}
          href={action.href}
          className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-sky-300 hover:bg-sky-50"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xl transition group-hover:bg-white">
              {action.icon}
            </div>

            <div>
              <p className="font-bold text-slate-900">
                {action.title}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {action.description}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
