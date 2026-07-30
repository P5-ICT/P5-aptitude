import Link from "next/link";
import { notFound } from "next/navigation";
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
    <div className="min-h-screen bg-p5-sand">
      <header className="border-b border-p5-navy/10 bg-p5-navy px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-display text-xl">Submission Detail</h1>
          <Link href="/admin" className="text-sm text-white/70 hover:text-white">
            Back to list
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h2 className="font-display text-2xl text-p5-navy">{detail.participantName}</h2>
          <p className="text-p5-ink/60">{detail.email}</p>
          <p className="mt-2 text-sm capitalize">
            Status: {detail.status} · Consent: {detail.consentGiven ? "Yes" : "No"}
          </p>
        </div>

        {detail.topRoles.length > 0 && (
          <section className="mb-10">
            <h3 className="mb-4 font-display text-xl text-p5-navy">Top 3 Recommendations</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {detail.topRoles.map((role) => (
                <div
                  key={role.roleCode}
                  className="rounded border border-p5-navy/10 bg-white p-4"
                >
                  <p className="text-sm text-p5-teal">#{role.rank}</p>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-2xl font-display text-p5-navy">{role.fitScore}%</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h3 className="mb-4 font-display text-xl text-p5-navy">Competency Scores</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {Object.entries(detail.competencyScores).map(([code, score]) => (
              <div
                key={code}
                className="flex justify-between rounded border border-p5-navy/5 bg-white px-4 py-2"
              >
                <span>{code}</span>
                <span>{Math.round(score)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-4 font-display text-xl text-p5-navy">All Role Scores</h3>
          <div className="grid gap-2 md:grid-cols-3">
            {Object.entries(detail.roleScores)
              .sort(([, a], [, b]) => b - a)
              .map(([code, score]) => (
                <div
                  key={code}
                  className="flex justify-between rounded border border-p5-navy/5 bg-white px-4 py-2"
                >
                  <span>{code}</span>
                  <span>{Math.round(score * 10) / 10}</span>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
