"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { clearSession } from "@/lib/session";
import type { TopRoleRecommendation } from "@/lib/types/catalog";

type StoredResults = {
  status: string;
  topRoles: TopRoleRecommendation[];
};

export default function ResultsPage() {
  const params = useParams<{ submissionId: string }>();
  const [topRoles, setTopRoles] = useState<TopRoleRecommendation[]>([]);
  const [status, setStatus] = useState<string>("loading");

  useEffect(() => {
    const raw = sessionStorage.getItem(`p5-results-${params.submissionId}`);
    if (!raw) {
      setStatus("not-found");
      return;
    }

    try {
      const data = JSON.parse(raw) as StoredResults;
      setTopRoles(data.topRoles ?? []);
      setStatus(data.status);
      clearSession();
      sessionStorage.removeItem(`p5-results-${params.submissionId}`);
    } catch {
      setStatus("error");
    }
  }, [params.submissionId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-p5-sand">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p>Loading your results...</p>
        </main>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="min-h-screen bg-p5-sand">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl text-p5-navy">Assessment not completed</h1>
          <p className="mt-4 text-p5-ink/70">
            Consent was not provided. Your responses have been recorded but no recommendations were generated.
          </p>
          <Link href="/" className="mt-8 inline-block text-p5-teal hover:underline">
            Return home
          </Link>
        </main>
      </div>
    );
  }

  if (status === "not-found" || status === "error") {
    return (
      <div className="min-h-screen bg-p5-sand">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl text-p5-navy">Results unavailable</h1>
          <p className="mt-4 text-p5-ink/70">
            We could not load results for this submission.
          </p>
          <Link href="/" className="mt-8 inline-block text-p5-teal hover:underline">
            Return home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-p5-sand to-white">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-sm uppercase tracking-widest text-p5-teal">Your results</p>
        <h1 className="font-display text-4xl text-p5-navy">Top 3 Role Pathways</h1>
        <p className="mt-2 text-p5-ink/70">
          Based on your assessment responses, these are your strongest role-family matches.
        </p>

        <div className="mt-10 space-y-6">
          {topRoles.map((role) => (
            <article
              key={role.roleCode}
              className="rounded-lg border border-p5-navy/10 bg-white p-6 shadow-sm"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl text-p5-navy">
                  #{role.rank} {role.name}
                </h2>
                <span className="text-lg font-medium text-p5-teal">
                  {role.fitScore}%
                </span>
              </div>
              <p className="mt-1 text-sm text-p5-ink/50">{role.roleCode}</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-p5-gold">Strengths</h3>
                  <ul className="mt-1 list-inside list-disc text-sm text-p5-ink/80">
                    {role.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-p5-gold">Gaps</h3>
                  <ul className="mt-1 list-inside list-disc text-sm text-p5-ink/80">
                    {role.gaps.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-p5-gold">Next steps</h3>
                  <ul className="mt-1 list-inside list-disc text-sm text-p5-ink/80">
                    {role.nextSteps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
