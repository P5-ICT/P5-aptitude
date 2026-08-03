"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ParticipantShell } from "@/components/features/assessment/participant-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { createSubmissionId, saveSession } from "@/lib/session";
import { getCatalog } from "@/lib/catalog";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const catalog = getCatalog();
  const firstSection = catalog.sections[0]?.slug ?? "consent-profile";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (!fullName || !email) {
      setError("Name and email are required.");
      return;
    }

    saveSession({
      participant: { fullName, email, phone: phone || undefined },
      submissionId: createSubmissionId(),
      startedAt: new Date().toISOString(),
      answers: {},
      currentSectionIndex: 0,
    });

    router.push(`/test/${firstSection}`);
  }

  return (
    <ParticipantShell>
      <div className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-3xl text-p5-navy text-balance tracking-tight">
          Register
        </h1>
        <p className="mt-2 max-w-prose text-p5-muted">
          Enter your details to begin the assessment. The test takes about 30 minutes
          across nine sections.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field name="fullName" label="Full name" required autoComplete="name" />
          <Field
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
          />
          <Field
            name="phone"
            label="Phone (optional)"
            type="tel"
            autoComplete="tel"
          />
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="secondary" className="w-full">
            Continue to assessment
          </Button>
        </form>
      </div>
    </ParticipantShell>
  );
}
