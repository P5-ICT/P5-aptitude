"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ParticipantShell } from "@/components/features/assessment/participant-shell";
import { Button } from "@/components/ui/button";
import { OptionChoice } from "@/components/ui/option-choice";
import { Progress } from "@/components/ui/progress";
import { getCatalog } from "@/lib/catalog";
import {
  CONSENT_QUESTION_ID,
  hasRefusedConsent,
  isConsentGiven,
} from "@/lib/scoring/consent";
import { loadSession, saveSession } from "@/lib/session";
import { getUnansweredRequiredQuestions } from "@/lib/validation/answers";

export default function TestSectionPage() {
  const params = useParams<{ sectionSlug: string }>();
  const router = useRouter();
  const catalog = getCatalog();
  const sectionSlug = params.sectionSlug;
  const sectionIndex = catalog.sections.findIndex((s) => s.slug === sectionSlug);
  const section = catalog.sections[sectionIndex];
  const questions = catalog.questions.filter((q) => q.sectionSlug === sectionSlug);
  const firstSectionSlug = catalog.sections[0]?.slug;

  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
    return loadSession()?.answers ?? {};
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const unansweredQuestions = useMemo(
    () => getUnansweredRequiredQuestions(questions, answers),
    [questions, answers],
  );
  const consentSelection =
    answers[CONSENT_QUESTION_ID] ?? loadSession()?.answers[CONSENT_QUESTION_ID];
  const consentRefused = hasRefusedConsent(consentSelection, catalog);
  const consentOk = isConsentGiven(consentSelection, catalog);
  const canProceed = unansweredQuestions.length === 0 && !consentRefused;

  useEffect(() => {
    const session = loadSession();
    if (!session) {
      router.replace("/register");
      return;
    }

    // Without affirmative consent, keep the participant on the first section.
    if (
      firstSectionSlug &&
      sectionSlug !== firstSectionSlug &&
      !isConsentGiven(session.answers[CONSENT_QUESTION_ID], catalog)
    ) {
      router.replace(`/test/${firstSectionSlug}`);
    }
  }, [router, catalog, firstSectionSlug, sectionSlug]);

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: [value] };
      const session = loadSession();
      if (session) {
        saveSession({ ...session, answers: { ...session.answers, ...next } });
      }
      return next;
    });
    setError("");
  }

  async function handleNext() {
    const session = loadSession();
    if (!session || !section) return;

    const mergedConsent =
      answers[CONSENT_QUESTION_ID] ?? session.answers[CONSENT_QUESTION_ID];

    if (hasRefusedConsent(mergedConsent, catalog)) {
      setError(
        "You must consent to continue. Without consent, the assessment cannot proceed.",
      );
      return;
    }

    if (!canProceed) {
      setError("Please answer all questions in this section before continuing.");
      return;
    }

    if (!isConsentGiven(mergedConsent, catalog)) {
      setError(
        "You must consent to continue. Without consent, the assessment cannot proceed.",
      );
      if (firstSectionSlug) {
        router.push(`/test/${firstSectionSlug}`);
      }
      return;
    }

    const merged = { ...session.answers, ...answers };
    const updated = { ...session, answers: merged, currentSectionIndex: sectionIndex };
    saveSession(updated);

    const isLast = sectionIndex >= catalog.sections.length - 1;
    if (!isLast) {
      setError("");
      router.push(`/test/${catalog.sections[sectionIndex + 1].slug}`);
      return;
    }

    const allUnanswered = getUnansweredRequiredQuestions(
      catalog.questions,
      merged,
    );
    if (allUnanswered.length > 0) {
      setError("Please answer all questions before submitting.");
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
          {questions.map((question) => {
            const isUnanswered = unansweredQuestions.some(
              (q) => q.questionId === question.questionId,
            );
            const isConsentQuestion = question.questionId === CONSENT_QUESTION_ID;

            return (
              <fieldset
                key={question.questionId}
                className={`space-y-3 rounded-xl ${isUnanswered && error ? "ring-2 ring-red-500/60 ring-offset-2" : ""} ${isConsentQuestion && consentRefused ? "ring-2 ring-red-500/60 ring-offset-2" : ""}`}
              >
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
                {isConsentQuestion && consentRefused && (
                  <p className="mt-3 text-sm text-red-600" role="alert">
                    Without consent you cannot continue this assessment. Select
                    &ldquo;Yes, I consent&rdquo; to proceed, or leave the assessment.
                  </p>
                )}
              </fieldset>
            );
          })}
        </div>

        {error && (
          <p className="mt-6 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {!canProceed && !error && !consentRefused && (
          <p className="mt-6 text-sm text-p5-muted">
            {unansweredQuestions.length === 1
              ? "1 question still needs an answer."
              : `${unansweredQuestions.length} questions still need answers.`}
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
          <Button
            onClick={handleNext}
            disabled={submitting || !canProceed || !consentOk}
          >
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
