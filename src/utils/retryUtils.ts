export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 1000;

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  
  let lastError: Error = new Error('No attempts made');
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        await delay(delayMs);
      }
    }
  }
  
  throw new Error(`Operation failed after ${maxAttempts} attempts: ${lastError.message}`);
}