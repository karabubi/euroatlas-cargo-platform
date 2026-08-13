import Link from "next/link";

const services = [
  {
    title: "Vehicle Shipping",
    description:
      "Professional vehicle transport management from Europe to North Africa.",
    icon: "🚗",
  },
  {
    title: "Cargo Management",
    description:
      "Manage shipments, documentation and cargo operations from one platform.",
    icon: "📦",
  },
  {
    title: "Shipment Tracking",
    description: "Follow shipment progress and important logistics milestones.",
    icon: "🌍",
  },
];

const features = [
  "Vehicle & cargo management",
  "Shipment status tracking",
  "Customs clearance workflow",
  "Vehicle inspections",
  "Document management",
  "Delivery management",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-lg font-black text-white">
              EA
            </div>

            <div>
              <p className="text-lg font-black tracking-tight">
                EuroAtlas Cargo
              </p>
              <p className="text-xs font-medium text-slate-500">
                Europe · North Africa
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/track"
              className="hidden rounded-lg px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 sm:block"
            >
              Track shipment
            </Link>

            <Link
              href="/login"
              className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Staff login
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.20),_transparent_35%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-sky-400">
              International logistics
            </p>

            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl">
              Cargo shipping between Europe and North Africa.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              EuroAtlas Cargo provides a modern platform for vehicle shipping,
              cargo operations, documentation and shipment tracking.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/track"
                className="rounded-xl bg-sky-500 px-6 py-3.5 text-center font-black text-white transition hover:bg-sky-400"
              >
                Track your shipment
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-slate-700 px-6 py-3.5 text-center font-black text-white transition hover:bg-slate-900"
              >
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-400">
              Cargo operations
            </p>

            <h2 className="mt-4 text-3xl font-black">
              One platform for the complete shipping workflow.
            </h2>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm font-black">
                    ✓
                  </span>

                  <span className="text-sm font-bold text-slate-200">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">
            Our platform
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Logistics management built for cargo operations
          </h2>

          <p className="mt-5 leading-7 text-slate-600">
            Manage the operational journey from vehicle registration through
            shipment preparation, transport, customs and final delivery.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-4xl">{service.icon}</div>

              <h3 className="mt-6 text-xl font-black">{service.title}</h3>

              <p className="mt-3 leading-7 text-slate-600">
                {service.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">
                Shipment tracking
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-tight">
                Follow your cargo journey
              </h2>

              <p className="mt-5 max-w-2xl leading-7 text-slate-600">
                Customers can use their shipment number to view the latest
                available tracking information.
              </p>
            </div>

            <Link
              href="/track"
              className="rounded-xl bg-slate-950 px-7 py-4 text-center font-black text-white transition hover:bg-slate-800"
            >
              Track shipment →
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="font-black text-white">EuroAtlas Cargo</p>
            <p className="mt-1 text-sm">
              International cargo management platform
            </p>
          </div>

          <div className="flex gap-6 text-sm font-semibold">
            <Link href="/track" className="transition hover:text-white">
              Tracking
            </Link>

            <Link href="/login" className="transition hover:text-white">
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
