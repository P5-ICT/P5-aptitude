"use client";

import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-p5-navy">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-lg">
        <h1 className="font-display text-2xl text-p5-navy">Staff Login</h1>
        <p className="mt-2 text-sm text-p5-ink/60">
          Sign in with your @pillar5group.co.za Google account.
        </p>
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="mt-6 w-full rounded bg-p5-teal px-4 py-3 font-medium text-white hover:bg-[#157777]"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
