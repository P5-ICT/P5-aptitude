const STORAGE_KEY = "p5-aptitude-session";

export type TestSession = {
  participant: { fullName: string; email: string; phone?: string };
  submissionId: string;
  startedAt: string;
  answers: Record<string, string[]>;
  currentSectionIndex: number;
};

export function createSubmissionId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadSession(): TestSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TestSession;
  } catch {
    return null;
  }
}

export function saveSession(session: TestSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
