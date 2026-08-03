"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ParticipantShell } from "@/components/features/assessment/participant-shell";
import { Button } from "@/components/ui/button";
import { OptionChoice } from "@/components/ui/option-choice";
import { Progress } from "@/components/ui/progress";
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
    return (
      <ParticipantShell>
        <p className="p-8 text-p5-muted">Section not found.</p>
      </ParticipantShell>
    );
  }

  return (
    <ParticipantShell>
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Progress
          current={sectionIndex + 1}
          total={catalog.sections.length}
        />

        <h1 className="mt-8 font-display text-3xl text-p5-navy text-balance tracking-tight">
          {section.title}
        </h1>

        <div className="mt-8 space-y-10">
          {questions.map((question) => (
            <fieldset key={question.questionId} className="space-y-3">
              <legend className="mb-3 block text-base font-medium text-p5-ink leading-snug">
                {question.text}
                {question.required && (
                  <span className="text-red-600" aria-hidden="true">
                    {" "}
                    *
                  </span>
                )}
              </legend>
              <div className="space-y-2">
                {question.options.map((option) => (
                  <OptionChoice
                    key={option.key}
                    name={question.questionId}
                    value={option.key}
                    label={option.label}
                    checked={answers[question.questionId]?.[0] === option.key}
                    onChange={(value) => setAnswer(question.questionId, value)}
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="sticky bottom-0 -mx-6 mt-10 flex items-center justify-between border-t border-p5-border bg-p5-bg/95 px-6 py-4 backdrop-blur-sm">
          {sectionIndex > 0 ? (
            <Button
              variant="ghost"
              onClick={() =>
                router.push(`/test/${catalog.sections[sectionIndex - 1].slug}`)
              }
            >
              Previous
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={handleNext} disabled={submitting}>
            {submitting
              ? "Submitting..."
              : sectionIndex >= catalog.sections.length - 1
                ? "Submit assessment"
                : "Next section"}
          </Button>
        </div>
      </div>
    </ParticipantShell>
  );
}
