"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SiteHeader } from "@/components/site-header";
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
    <div className="min-h-screen bg-p5-sand">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="font-display text-3xl text-p5-navy">Register</h1>
        <p className="mt-2 text-p5-ink/70">
          Enter your details to begin the assessment.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium">Full name</span>
            <input
              name="fullName"
              required
              className="mt-1 w-full rounded border border-p5-navy/20 bg-white px-4 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-p5-navy/20 bg-white px-4 py-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium">Phone (optional)</span>
            <input
              name="phone"
              type="tel"
              className="mt-1 w-full rounded border border-p5-navy/20 bg-white px-4 py-2"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full rounded bg-p5-teal px-6 py-3 font-medium text-white hover:bg-[#157777]"
          >
            Continue to assessment
          </button>
        </form>
      </main>
    </div>
  );
}
