import React, { createContext, useCallback, useContext, useState } from "react";

import type { ActionSheetProps } from "./ActionSheet";
import { ActionSheet } from "./ActionSheet";

type ActionSheetOptions = Omit<ActionSheetProps, "isVisible">;

interface ActionSheetContextValue {
  show: (props: ActionSheetOptions) => void;
  hide: () => void;
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null);

const ANIMATION_DURATION = 400; // Duration for sheet animation

export const ActionSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [sheetQueue, setSheetQueue] = useState<ActionSheetOptions[]>([]);
  const [currentSheet, setCurrentSheet] = useState<ActionSheetOptions | null>(
    null,
  );
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const processNextSheet = useCallback(() => {
    if (sheetQueue.length > 0) {
      const nextSheet = sheetQueue[0];
      if (nextSheet) {
        setSheetQueue((prev) => prev.slice(1));
        setCurrentSheet(nextSheet);
        // Small delay to ensure proper mounting
        setTimeout(() => {
          setIsVisible(true);
          setIsAnimatingOut(false);
        }, 50);
      }
    } else {
      setCurrentSheet(null);
      setIsAnimatingOut(false);
    }
  }, [sheetQueue]);

  const hide = useCallback(() => {
    if (isAnimatingOut) return;

    setIsAnimatingOut(true);
    setIsVisible(false);

    // Wait for hide animation to complete
    setTimeout(() => {
      if (sheetQueue.length > 0) {
        processNextSheet();
      } else {
        setCurrentSheet(null);
        setIsAnimatingOut(false);
      }
    }, ANIMATION_DURATION);
  }, [processNextSheet, sheetQueue.length, isAnimatingOut]);

  const show = useCallback(
    (props: ActionSheetOptions) => {
      if (isAnimatingOut) return;

      const wrappedProps = {
        ...props,
        onCancel: () => {
          props.onCancel?.();
          hide();
        },
      };

      if (!currentSheet || !isVisible) {
        setCurrentSheet(wrappedProps);
        setIsVisible(true);
      } else {
        setSheetQueue((prev) => [...prev, wrappedProps]);
        hide();
      }
    },
    [hide, isVisible, currentSheet, isAnimatingOut],
  );

  return (
    <ActionSheetContext.Provider value={{ show, hide }}>
      {children}
      {currentSheet && (
        <ActionSheet
          {...currentSheet}
          isVisible={isVisible}
          key={currentSheet.title} // Force remount for each new sheet
        />
      )}
    </ActionSheetContext.Provider>
  );
};

export const useActionSheetController = () => {
  const context = useContext(ActionSheetContext);
  if (!context) {
    throw new Error(
      "useActionSheetController must be used within an ActionSheetProvider",
    );
  }
  return context;
};
