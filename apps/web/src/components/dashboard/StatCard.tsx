type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: string;
};

export function StatCard({
  title,
  value,
  description,
  icon,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            {value.toLocaleString()}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-2xl">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {description}
      </p>
    </article>
  );
}
