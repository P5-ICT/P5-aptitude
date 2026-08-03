"use client";

import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  return (
    <div className="landing-atmosphere flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-page-enter">
        <div className="mb-8 text-center text-white">
          <p className="font-display text-3xl tracking-tight">Pillar 5</p>
          <p className="mt-1 text-sm text-white/60">Staff access</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-p5-surface p-8">
          <h1 className="font-display text-xl text-p5-navy">Sign in</h1>
          <p className="mt-2 text-sm text-p5-muted">
            Use your @pillar5group.co.za Google account to access the admin
            dashboard.
          </p>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/admin" })}
            className="focus-ring mt-6 w-full rounded bg-p5-teal px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-p5-teal-hover"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
