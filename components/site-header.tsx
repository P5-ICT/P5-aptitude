"use client";

import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-[var(--z-sticky)] border-b border-white/10 bg-p5-navy/95 text-white backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="font-display text-2xl tracking-tight text-balance hover:text-white/90"
          >
            Pillar 5
          </Link>
          <span
            className="hidden text-sm text-white/60 sm:inline"
            aria-hidden="true"
          >
            Aptitude Assessment
          </span>
        </div>
        <Link
          href="/admin/login"
          className="focus-ring shrink-0 rounded px-3 py-2 text-sm text-white/70 transition-colors duration-150 hover:bg-white/5 hover:text-white"
        >
          Admin login
        </Link>
      </div>
    </header>
  );
}
