type ProgressProps = {
  current: number;
  total: number;
  label?: string;
};

export function Progress({ current, total, label }: ProgressProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total} aria-label={label ?? `Section ${current} of ${total}`}>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="font-medium text-p5-teal">
          Section {current} of {total}
        </span>
        <span className="text-p5-muted">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-p5-border">
        <div
          className="progress-bar-fill h-full rounded-full bg-p5-teal"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
