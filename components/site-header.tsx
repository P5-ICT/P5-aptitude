"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-p5-navy/10 bg-p5-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-2xl tracking-wide">
          Pillar 5
        </Link>
        <span className="text-sm text-white/70">Aptitude Assessment</span>
      </div>
    </header>
  );
}
