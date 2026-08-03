import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-400">
            EuroAtlas Cargo
          </p>

          <h1 className="mt-6 max-w-xl text-5xl font-bold leading-tight">
            Cargo management from Europe to North
            Africa
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Manage customers, vehicles, shipments,
            containers, tracking and invoices in one
            platform.
          </p>
        </div>

        <p className="text-sm text-slate-400">
          Secure logistics management platform
        </p>
      </section>

      <section className="flex items-center justify-center bg-slate-100 px-6 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-slate-600">
              Sign in to your EuroAtlas Cargo account.
            </p>
          </div>

          <LoginForm />
        </div>
      </section>
    </main>
  );
}