/* eslint-disable no-debugger */

export const shouldNeverHappen = (msg?: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    debugger;
  }

  throw new Error(
    `shouldNeverHappen: ${msg ?? "unknown error"} ${JSON.stringify(args)}`,
  );
};

export const invariant: <T>(
  predicate: T,
  msg?: string,
) => asserts predicate is NonNullable<T> = (predicate, msg) => {
  if (predicate) return;
  throw new Error(`Invariant failed: ${msg}`);
};
