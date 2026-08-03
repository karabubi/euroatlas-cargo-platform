import { StatCard } from '@/components/ui/stat-card';

export default function DashboardPage() {
  return (
    <section>
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-600">
          Overview of the EuroAtlas Cargo platform.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Customers"
          value={0}
          description="Registered customers"
        />

        <StatCard
          title="Active shipments"
          value={0}
          description="Shipments currently in progress"
        />

        <StatCard
          title="Vehicles"
          value={0}
          description="Vehicles registered for shipping"
        />

        <StatCard
          title="Pending quotes"
          value={0}
          description="Quotes waiting for action"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Recent activity
        </h2>

        <p className="mt-3 text-slate-600">
          Shipment and customer activity will appear
          here after the business modules are created.
        </p>
      </div>
    </section>
  );
}