interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
}

export function StatCard({
  title,
  value,
  description,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-sm text-slate-600">
        {description}
      </p>
    </article>
  );
}