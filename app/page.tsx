import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function HomePage() {
  return (
    <div className="landing-atmosphere min-h-screen text-white">
      <SiteHeader />
      <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl flex-col justify-center px-6 py-16 animate-page-enter">
        <div className="max-w-xl">
          <h1 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] tracking-tight text-balance">
            Pillar 5
          </h1>
          <p className="mt-4 font-display text-[clamp(1.25rem,3vw,1.75rem)] leading-snug text-white/90 text-balance">
            Aptitude Assessment
          </p>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75 text-pretty">
            Discover your top three role pathways through an 84-question assessment
            designed for Pillar 5 talent development.
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="focus-ring inline-flex rounded bg-p5-gold px-8 py-3.5 text-sm font-semibold text-p5-navy transition-colors duration-150 hover:bg-p5-gold-hover"
            >
              Begin assessment
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
