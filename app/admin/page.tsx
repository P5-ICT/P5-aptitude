import Link from "next/link";
import { getSubmissions } from "@/lib/admin/submissions";

export default async function AdminDashboardPage() {
  const submissions = await getSubmissions();

  return (
    <div className="min-h-screen bg-p5-sand">
      <header className="border-b border-p5-navy/10 bg-p5-navy px-6 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="font-display text-xl">Pillar 5 Admin</h1>
          <span className="text-sm text-white/60">Submissions</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        {!process.env.AIRTABLE_API_KEY && (
          <p className="mb-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Airtable not configured — set AIRTABLE_API_KEY and AIRTABLE_BASE_ID to load submissions.
          </p>
        )}
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-p5-navy/10 text-p5-ink/60">
              <th className="py-3 pr-4">Name</th>
              <th className="py-3 pr-4">Email</th>
              <th className="py-3 pr-4">Date</th>
              <th className="py-3 pr-4">Status</th>
              <th className="py-3 pr-4">Top role</th>
              <th className="py-3" />
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-p5-ink/50">
                  No submissions yet.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub.id} className="border-b border-p5-navy/5">
                  <td className="py-3 pr-4">{sub.participantName}</td>
                  <td className="py-3 pr-4">{sub.email}</td>
                  <td className="py-3 pr-4">
                    {sub.completedAt
                      ? new Date(sub.completedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="py-3 pr-4 capitalize">{sub.status}</td>
                  <td className="py-3 pr-4">{sub.topRole}</td>
                  <td className="py-3">
                    <Link
                      href={`/admin/submissions/${sub.id}`}
                      className="text-p5-teal hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="mt-8 text-sm text-p5-ink/50">
          Export data via Airtable native table CSV export.
        </p>
      </main>
    </div>
  );
}
