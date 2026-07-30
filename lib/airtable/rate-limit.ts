const MIN_INTERVAL_MS = 200;

let lastRequestAt = 0;

export async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

export async function withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  await rateLimit();
  return fn();
}
