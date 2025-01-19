import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { runOnJS } from "react-native-reanimated";

import type { ActionSheetProps } from "./ActionSheet";
import { ActionSheet } from "./ActionSheet";

type ActionSheetOptions = Omit<
  ActionSheetProps,
  "isVisible" | "id" | "onAnimationComplete"
>;

interface QueuedSheet extends ActionSheetOptions {
  id: string;
  timestamp: number;
  resolve: () => void;
  reject: () => void;
}

interface SheetState {
  status: "IDLE" | "ENTERING" | "VISIBLE" | "EXITING";
  currentSheet: QueuedSheet | null;
  queue: QueuedSheet[];
  isVisible: boolean;
}

interface ActionSheetContextValue {
  show: (props: ActionSheetOptions) => Promise<void>;
  hide: (id?: string) => void;
  hideAll: () => void;
  update: (id: string, props: Partial<ActionSheetOptions>) => void;
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null);

const generateSheetId = () =>
  `sheet-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const ActionSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // State machine for sheet management
  const [state, setState] = useState<SheetState>({
    status: "IDLE",
    currentSheet: null,
    queue: [],
    isVisible: false,
  });

  // Refs for managing async operations and cleanup
  const timeoutRef = useRef<NodeJS.Timeout>();
  const isTransitioningRef = useRef(false);

  const cleanupTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Process the next sheet in queue
  const processNextSheet = useCallback(() => {
    setState((prev) => {
      if (prev.queue.length === 0 || isTransitioningRef.current) {
        return prev;
      }

      const [nextSheet, ...remainingQueue] = prev.queue;
      if (!nextSheet) return prev;

      isTransitioningRef.current = true;

      return {
        status: "ENTERING",
        currentSheet: nextSheet,
        queue: remainingQueue,
        isVisible: true,
      } satisfies SheetState;
    });
  }, []);

  // Handle animation completion
  const handleAnimationComplete = useCallback(
    (finished: boolean) => {
      if (!finished) return;

      setState((prev) => {
        if (prev.status === "EXITING") {
          isTransitioningRef.current = false;

          // If there are sheets in queue, process next
          if (prev.queue.length > 0) {
            timeoutRef.current = setTimeout(processNextSheet, 50);
            return prev;
          }

          // Otherwise, reset to idle state
          return {
            status: "IDLE",
            currentSheet: null,
            queue: [],
            isVisible: false,
          };
        }

        if (prev.status === "ENTERING") {
          isTransitioningRef.current = false;
          return {
            ...prev,
            status: "VISIBLE",
          };
        }

        return prev;
      });
    },
    [processNextSheet],
  );

  // Hide current sheet
  const hide = useCallback((id?: string) => {
    setState((prev) => {
      // Don't allow hiding if we're already transitioning or no sheet is visible
      if (!prev.currentSheet || prev.status === "EXITING") {
        return prev;
      }

      // If ID is provided, only hide if it matches current sheet
      if (id && id !== prev.currentSheet.id) {
        return prev;
      }

      isTransitioningRef.current = true;
      prev.currentSheet.resolve();

      return {
        ...prev,
        status: "EXITING",
        isVisible: false,
      };
    });
  }, []);

  // Hide all sheets
  const hideAll = useCallback(() => {
    setState((prev) => {
      // Resolve all promises
      prev.currentSheet?.resolve();
      prev.queue.forEach((sheet) => sheet.resolve());

      return {
        status: "IDLE",
        currentSheet: null,
        queue: [],
        isVisible: false,
      };
    });
  }, []);

  // Show a new sheet
  const show = useCallback(
    (props: ActionSheetOptions): Promise<void> => {
      return new Promise((resolve, reject) => {
        const newSheet: QueuedSheet = {
          ...props,
          id: generateSheetId(),
          timestamp: Date.now(),
          resolve,
          reject,
          onCancel: () => {
            props.onCancel?.();
            hide();
          },
        };

        setState((prev) => {
          // If no active sheet or not visible, show immediately
          if (prev.status === "IDLE") {
            return {
              status: "ENTERING",
              currentSheet: newSheet,
              queue: [],
              isVisible: true,
            };
          }

          // If a sheet is currently visible or in transition
          if (prev.currentSheet) {
            // Force hide the current sheet, which will trigger showing the next one
            isTransitioningRef.current = true;
            prev.currentSheet.resolve(); // Resolve the current sheet's promise

            return {
              status: "EXITING",
              currentSheet: prev.currentSheet,
              queue: [...prev.queue, newSheet],
              isVisible: false,
            };
          }

          return {
            ...prev,
            queue: [...prev.queue, newSheet],
          };
        });
      });
    },
    [hide],
  );

  // Update an existing sheet
  const update = useCallback(
    (id: string, props: Partial<ActionSheetOptions>) => {
      setState((prev) => {
        if (prev.currentSheet?.id === id) {
          return {
            ...prev,
            currentSheet: {
              ...prev.currentSheet,
              ...props,
            },
          };
        }

        return {
          ...prev,
          queue: prev.queue.map((sheet) =>
            sheet.id === id ? { ...sheet, ...props } : sheet,
          ),
        };
      });
    },
    [],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      cleanupTimeouts();
      state.currentSheet?.reject();
      state.queue.forEach((sheet) => sheet.reject());
    };
  }, [cleanupTimeouts, state.currentSheet, state.queue]);

  const contextValue = React.useMemo(
    () => ({
      show,
      hide,
      hideAll,
      update,
    }),
    [show, hide, hideAll, update],
  );

  return (
    <ActionSheetContext.Provider value={contextValue}>
      {children}
      {state.currentSheet && (
        <ActionSheet
          {...state.currentSheet}
          isVisible={state.isVisible}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </ActionSheetContext.Provider>
  );
};

export const useActionSheetController = () => {
  const context = useContext(ActionSheetContext);
  if (!context) {
    throw new Error(
      "useActionSheet must be used within an ActionSheetProvider",
    );
  }
  return context;
};
