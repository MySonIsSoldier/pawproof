import "server-only";
import { FunctionTimeoutError } from "./http";

/**
 * Returns a predictable JSON error before Vercel's hard function cutoff.
 * The underlying provider calls still have their own fetch timeouts.
 */
export function withFunctionBudget<T>(work: () => Promise<T>, budgetMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new FunctionTimeoutError()), budgetMs);
    let pending: Promise<T>;
    try {
      pending = work();
    } catch (error) {
      clearTimeout(timer);
      reject(error);
      return;
    }
    void pending.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
