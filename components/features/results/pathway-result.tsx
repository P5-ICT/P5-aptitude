import type { TopRoleRecommendation } from "@/lib/types/catalog";

type PathwayResultProps = {
  role: TopRoleRecommendation;
};

export function PathwayResult({ role }: PathwayResultProps) {
  return (
    <article className="border-b border-p5-border pb-8 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl text-p5-navy text-balance tracking-tight">
          <span className="text-p5-teal">{role.rank}.</span> {role.name}
        </h2>
        <span className="font-display text-xl text-p5-teal">{role.fitScore}% fit</span>
      </div>
      <p className="mt-1 text-sm text-p5-muted">{role.roleCode}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-p5-gold">
            Strengths
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-p5-ink">
            {role.reasons.map((r) => (
              <li key={r} className="leading-relaxed">
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-p5-gold">
            Gaps
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-p5-ink">
            {role.gaps.map((g) => (
              <li key={g} className="leading-relaxed">
                {g}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-p5-gold">
            Next steps
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-p5-ink">
            {role.nextSteps.map((s) => (
              <li key={s} className="leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
