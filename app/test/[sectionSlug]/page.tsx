"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { getCatalog } from "@/lib/catalog";
import { loadSession, saveSession } from "@/lib/session";

export default function TestSectionPage() {
  const params = useParams<{ sectionSlug: string }>();
  const router = useRouter();
  const catalog = getCatalog();
  const sectionSlug = params.sectionSlug;
  const sectionIndex = catalog.sections.findIndex((s) => s.slug === sectionSlug);
  const section = catalog.sections[sectionIndex];
  const questions = catalog.questions.filter((q) => q.sectionSlug === sectionSlug);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/register");
      return;
    }
    setAnswers(session.answers);
  }, [router]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: [value] }));
  }

  async function handleNext() {
    const session = loadSession();
    if (!session || !section) return;

    const merged = { ...session.answers, ...answers };
    const updated = { ...session, answers: merged, currentSectionIndex: sectionIndex };
    saveSession(updated);

    const isLast = sectionIndex >= catalog.sections.length - 1;
    if (!isLast) {
      router.push(`/test/${catalog.sections[sectionIndex + 1].slug}`);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        participant: session.participant,
        submissionId: session.submissionId,
        startedAt: session.startedAt,
        answers: catalog.questions.map((q) => ({
          questionId: q.questionId,
          selectedOptions: merged[q.questionId] ?? [],
        })),
      };

      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Submit failed");
      }

      const data = await response.json();
      sessionStorage.setItem(
        `p5-results-${session.submissionId}`,
        JSON.stringify(data),
      );

      router.push(`/results/${session.submissionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
      setSubmitting(false);
    }
  }

  if (!section) {
    return <p className="p-8">Section not found.</p>;
  }

  return (
    <div className="min-h-screen bg-p5-sand">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <p className="text-sm text-p5-teal">
          Section {sectionIndex + 1} of {catalog.sections.length}
        </p>
        <h1 className="font-display text-3xl text-p5-navy">{section.title}</h1>

        <div className="mt-8 space-y-8">
          {questions.map((question) => (
            <fieldset key={question.questionId} className="space-y-3">
              <legend className="font-medium text-p5-ink">
                {question.text}
                {question.required && <span className="text-red-500"> *</span>}
              </legend>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label
                    key={option.key}
                    className="flex cursor-pointer items-center gap-3 rounded border border-p5-navy/10 bg-white px-4 py-3 hover:border-p5-teal"
                  >
                    <input
                      type="radio"
                      name={question.questionId}
                      value={option.key}
                      checked={answers[question.questionId]?.[0] === option.key}
                      onChange={() => setAnswer(question.questionId, option.key)}
                      className="accent-p5-teal"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-10 flex justify-between">
          {sectionIndex > 0 ? (
            <button
              type="button"
              onClick={() =>
                router.push(`/test/${catalog.sections[sectionIndex - 1].slug}`)
              }
              className="text-p5-teal hover:underline"
            >
              Previous
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={submitting}
            className="rounded bg-p5-navy px-6 py-2 text-white hover:bg-p5-navy/90 disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : sectionIndex >= catalog.sections.length - 1
                ? "Submit assessment"
                : "Next section"}
          </button>
        </div>
      </main>
    </div>
  );
}
