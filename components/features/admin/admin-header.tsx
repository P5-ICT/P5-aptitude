import Link from "next/link";
import type { ReactNode } from "react";

type AdminHeaderProps = {
  title: string;
  action?: ReactNode;
};

export function AdminHeader({ title, action }: AdminHeaderProps) {
  return (
    <header className="border-b border-white/10 bg-p5-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="font-display text-lg tracking-tight hover:text-white/80"
          >
            Pillar 5
          </Link>
          <span className="text-white/30">/</span>
          <h1 className="text-sm font-medium text-white/80">{title}</h1>
        </div>
        {action}
      </div>
    </header>
  );
}
