export default function CustomersPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">
        Customers
      </h1>

      <p className="mt-2 text-slate-600">
        Customer management will be added in the next
        backend module.
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <h2 className="text-xl font-semibold text-slate-900">
          No customer module yet
        </h2>

        <p className="mt-2 text-slate-500">
          The next backend step is to create the
          Customer Prisma model and customer API.
        </p>
      </div>
    </section>
  );
}