import { useCallback, useRef } from "react";

export const useThrottleWithIncreaseDelay = (
  fn: (...args: any[]) => void | Promise<void>,
  initialDelay: number,
) => {
  const lastRun = useRef(0);
  const currentDelay = useRef(initialDelay);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  const throttledFunction = useCallback(
    (...args: any[]) => {
      const now = Date.now();

      const execute = () => {
        lastRun.current = now;
        fn(...args);
        currentDelay.current = initialDelay; // Reset delay after execution
        if (timeoutId.current) {
          clearTimeout(timeoutId.current); // Clear the timeout
          timeoutId.current = null;
        }
      };

      if (timeoutId.current) {
        clearTimeout(timeoutId.current); // Clear the existing timeout
      }

      timeoutId.current = setTimeout(() => {
        execute();
      }, currentDelay.current);

      currentDelay.current = initialDelay; // Reset delay after setting the timeout
    },
    [fn, initialDelay],
  );

  return throttledFunction;
};
