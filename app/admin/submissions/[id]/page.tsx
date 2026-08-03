import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/features/admin/admin-header";
import { getSubmissionDetail } from "@/lib/admin/submissions";

export default async function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSubmissionDetail(id);
  if (!detail) notFound();

  return (
    <div className="min-h-screen bg-p5-bg">
      <AdminHeader
        title="Submission detail"
        action={
          <Link
            href="/admin"
            className="focus-ring text-sm text-white/70 hover:text-white"
          >
            Back to list
          </Link>
        }
      />
      <main className="mx-auto max-w-6xl px-6 py-10 animate-page-enter">
        <div className="mb-10 border-b border-p5-border pb-8">
          <h2 className="font-display text-2xl text-p5-navy tracking-tight">
            {detail.participantName}
          </h2>
          <p className="mt-1 text-p5-muted">{detail.email}</p>
          <p className="mt-3 text-sm text-p5-ink">
            Status: <span className="capitalize">{detail.status}</span>
            {" · "}
            Consent: {detail.consentGiven ? "Yes" : "No"}
          </p>
        </div>

        {detail.topRoles.length > 0 && (
          <section className="mb-10">
            <h3 className="mb-4 font-display text-xl text-p5-navy">
              Top 3 recommendations
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {detail.topRoles.map((role) => (
                <div
                  key={role.roleCode}
                  className="rounded-xl border border-p5-border bg-p5-surface p-5"
                >
                  <p className="text-xs font-medium text-p5-teal">#{role.rank}</p>
                  <p className="mt-1 font-medium text-p5-ink">{role.name}</p>
                  <p className="mt-2 font-display text-2xl text-p5-navy">
                    {role.fitScore}%
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h3 className="mb-4 font-display text-xl text-p5-navy">
            Competency scores
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(detail.competencyScores).map(([code, score]) => (
              <div
                key={code}
                className="flex justify-between rounded-xl border border-p5-border bg-p5-surface px-4 py-2.5 text-sm"
              >
                <span className="text-p5-ink">{code}</span>
                <span className="font-medium text-p5-navy">{Math.round(score)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-display text-xl text-p5-navy">All role scores</h3>
          <div className="grid gap-2 sm:grid-cols-3">
            {Object.entries(detail.roleScores)
              .sort(([, a], [, b]) => b - a)
              .map(([code, score]) => (
                <div
                  key={code}
                  className="flex justify-between rounded-xl border border-p5-border bg-p5-surface px-4 py-2.5 text-sm"
                >
                  <span className="text-p5-ink">{code}</span>
                  <span className="font-medium text-p5-navy">
                    {Math.round(score * 10) / 10}
                  </span>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
