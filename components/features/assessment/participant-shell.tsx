import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";

type ParticipantShellProps = {
  children: ReactNode;
  className?: string;
};

export function ParticipantShell({ children, className = "" }: ParticipantShellProps) {
  return (
    <div className={`min-h-screen bg-p5-bg ${className}`}>
      <SiteHeader />
      <main className="animate-page-enter">{children}</main>
    </div>
  );
}
