"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-[var(--z-sticky)] border-b border-white/10 bg-p5-navy/95 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight text-balance hover:text-white/90"
        >
          Pillar 5
        </Link>
        <span className="hidden text-sm text-white/60 sm:inline">
          Aptitude Assessment
        </span>
      </div>
    </header>
  );
}
