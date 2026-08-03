interface LoadingSpinnerProps {
  text?: string;
}

export function LoadingSpinner({
  text = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />

        <p className="mt-4 text-sm text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );
}