"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ParticipantShell } from "@/components/features/assessment/participant-shell";
import { PathwayResult } from "@/components/features/results/pathway-result";
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
      <ParticipantShell>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="text-p5-muted">Loading your results…</p>
        </div>
      </ParticipantShell>
    );
  }

  if (status === "rejected") {
    return (
      <ParticipantShell>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl text-p5-navy text-balance tracking-tight">
            Assessment not completed
          </h1>
          <p className="mt-4 max-w-prose text-p5-muted">
            Consent was not provided. Your responses have been recorded but no
            recommendations were generated.
          </p>
          <Link
            href="/"
            className="focus-ring mt-8 inline-block text-p5-teal hover:underline"
          >
            Return home
          </Link>
        </div>
      </ParticipantShell>
    );
  }

  if (status === "not-found" || status === "error") {
    return (
      <ParticipantShell>
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="font-display text-3xl text-p5-navy text-balance tracking-tight">
            Results unavailable
          </h1>
          <p className="mt-4 max-w-prose text-p5-muted">
            We could not load results for this submission. Results are only
            available immediately after completing the assessment.
          </p>
          <Link
            href="/"
            className="focus-ring mt-8 inline-block text-p5-teal hover:underline"
          >
            Return home
          </Link>
        </div>
      </ParticipantShell>
    );
  }

  return (
    <ParticipantShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl text-p5-navy text-balance tracking-tight">
          Your top 3 role pathways
        </h1>
        <p className="mt-3 max-w-prose text-p5-muted">
          Based on your assessment responses, these are your strongest role-family
          matches at Pillar 5.
        </p>

        <div className="mt-12 space-y-10 rounded-xl border border-p5-border bg-p5-surface p-8">
          {topRoles.map((role) => (
            <PathwayResult key={role.roleCode} role={role} />
          ))}
        </div>
      </div>
    </ParticipantShell>
  );
}
