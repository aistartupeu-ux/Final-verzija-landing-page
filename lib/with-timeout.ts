/**
 * Čeka `promise` do `ms` ms; ako ne stigne — vraća `fallback` (npr. prazan Sheet da admin ne „visi“).
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T, label?: string): Promise<T> {
  return new Promise((resolve) => {
    const id = setTimeout(() => {
      if (label) {
        console.warn(`[withTimeout] ${label} exceeded ${ms}ms — using fallback`);
      }
      resolve(fallback);
    }, ms);
    promise
      .then((v) => {
        clearTimeout(id);
        resolve(v);
      })
      .catch(() => {
        clearTimeout(id);
        resolve(fallback);
      });
  });
}
