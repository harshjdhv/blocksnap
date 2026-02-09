// ============================================================================
// BlockSnap Extension - Throttle Utility
// ============================================================================

/**
 * Creates a throttled version of a function that only executes
 * at most once per specified interval.
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): T {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      // Schedule a call for the remaining time
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  }) as T;
}

/**
 * Creates a debounced version of a function that only executes
 * after the specified delay has passed without new calls.
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  }) as T;
}

/**
 * Wraps a function to execute on the next animation frame.
 * Prevents multiple calls per frame.
 */
export function rafThrottle<T extends (...args: any[]) => void>(fn: T): T {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return ((...args: Parameters<T>) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (lastArgs) {
          fn(...lastArgs);
        }
      });
    }
  }) as T;
}
