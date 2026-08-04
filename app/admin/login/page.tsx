"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Field } from "@/components/ui/field";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Incorrect password. Try again.",
  Configuration:
    "Auth is misconfigured. Check ADMIN_PASSWORD and NEXTAUTH_SECRET.",
  Default: "Sign-in failed. Try again or contact an admin.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");
  const queryError = errorCode
    ? (ERROR_MESSAGES[errorCode] ?? `${ERROR_MESSAGES.Default} (${errorCode})`)
    : null;

  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    setLoading(false);

    if (result?.error) {
      setFormError(
        ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.Default,
      );
      return;
    }

    router.push(result?.url ?? "/admin");
  }

  const errorMessage = formError ?? queryError;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-p5-surface p-8"
    >
      <h1 className="font-display text-xl text-p5-navy">Sign in</h1>
      <p className="mt-2 text-sm text-p5-muted">
        Enter the staff password to access the admin dashboard.
      </p>
      {errorMessage && (
        <p
          className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      <div className="mt-6">
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading || !password}
        className="focus-ring mt-6 w-full rounded bg-p5-teal px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-p5-teal-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
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
        <Suspense
          fallback={
            <div className="rounded-xl border border-white/10 bg-p5-surface p-8 text-sm text-p5-muted">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
