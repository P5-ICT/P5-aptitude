import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-p5-navy via-[#123456] to-p5-teal text-white">
      <SiteHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-20">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-p5-gold">
            Pillar 5
          </p>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">
            Aptitude Assessment
          </h1>
          <p className="mt-6 text-lg text-white/80">
            Discover your top three role pathways through an 84-question assessment
            designed for Pillar 5 talent development.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded bg-p5-gold px-8 py-3 font-medium text-p5-navy transition hover:bg-[#ddb52e]"
            >
              Begin assessment
            </Link>
          </div>
        </div>
        <div className="grid gap-4 text-sm text-white/60 md:grid-cols-3">
          <p>9 sections · ~30 minutes</p>
          <p>Automatic scoring</p>
          <p>Top 3 role recommendations</p>
        </div>
      </main>
    </div>
  );
}
