import Link from "next/link";
import { AdminHeader } from "@/components/features/admin/admin-header";
import { getSubmissions } from "@/lib/admin/submissions";

export default async function AdminDashboardPage() {
  const submissions = await getSubmissions();

  return (
    <div className="min-h-screen bg-p5-bg">
      <AdminHeader title="Submissions" />
      <main className="mx-auto max-w-6xl px-6 py-10 animate-page-enter">
        {!process.env.AIRTABLE_API_KEY && (
          <p className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Airtable not configured — set AIRTABLE_API_KEY and AIRTABLE_BASE_ID to
            load submissions.
          </p>
        )}
        <div className="overflow-x-auto rounded-xl border border-p5-border bg-p5-surface">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-p5-border bg-p5-bg text-p5-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Top role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-p5-muted">
                    No submissions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-p5-border last:border-b-0 hover:bg-p5-bg/50"
                  >
                    <td className="px-4 py-3 font-medium text-p5-ink">
                      {sub.participantName}
                    </td>
                    <td className="px-4 py-3 text-p5-muted">{sub.email}</td>
                    <td className="px-4 py-3 text-p5-muted">
                      {sub.completedAt
                        ? new Date(sub.completedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 capitalize text-p5-ink">{sub.status}</td>
                    <td className="px-4 py-3 text-p5-teal">{sub.topRole}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/submissions/${sub.id}`}
                        className="focus-ring text-p5-teal hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
