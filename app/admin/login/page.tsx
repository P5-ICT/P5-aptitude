"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied:
    "Access denied. Sign in with a @pillar5group.co.za Google account (or update STAFF_EMAIL_DOMAIN).",
  OAuthAccountNotLinked:
    "This Google account could not be linked. Try again with your staff email.",
  OAuthCallback:
    "Google sign-in failed (callback error). Check NEXTAUTH_URL and Google redirect URIs.",
  Configuration:
    "Auth is misconfigured. Check GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and NEXTAUTH_SECRET.",
  Default: "Sign-in failed. Try again or contact an admin.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const errorMessage = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? `${ERROR_MESSAGES.Default} (${errorCode})`)
    : null;

  return (
    <div className="rounded-xl border border-white/10 bg-p5-surface p-8">
      <h1 className="font-display text-xl text-p5-navy">Sign in</h1>
      <p className="mt-2 text-sm text-p5-muted">
        Use your @pillar5group.co.za Google account to access the admin
        dashboard.
      </p>
      {errorMessage && (
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/admin" })}
        className="focus-ring mt-6 w-full rounded bg-p5-teal px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-p5-teal-hover"
      >
        Continue with Google
      </button>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="landing-atmosphere flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-page-enter">
        <div className="mb-8 text-center text-white">
          <p className="font-display text-3xl tracking-tight">Pillar 5</p>
          <p className="mt-1 text-sm text-white/60">Staff access</p>
        </div>
        <Suspense fallback={<div className="rounded-xl border border-white/10 bg-p5-surface p-8 text-sm text-p5-muted">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
