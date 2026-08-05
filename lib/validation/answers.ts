import type { Question } from "@/lib/types/catalog";

export function isQuestionAnswered(
  question: Question,
  selectedOptions: string[] | undefined,
): boolean {
  if (!question.required) return true;
  return Boolean(selectedOptions && selectedOptions.length > 0);
}

export function getUnansweredRequiredQuestions(
  questions: Question[],
  answers: Record<string, string[]>,
): Question[] {
  return questions.filter(
    (question) => !isQuestionAnswered(question, answers[question.questionId]),
  );
}
