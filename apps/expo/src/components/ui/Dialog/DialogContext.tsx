import React, { createContext, useCallback, useContext, useState } from "react";

import type { DialogProps } from "./Dialog";
import { Dialog } from "./Dialog";

type DialogOptions = Omit<DialogProps, "isVisible" | "onAnimationComplete">;

interface DialogContextValue {
  show: (props: DialogOptions) => Promise<void>;
  hide: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [dialogState, setDialogState] = useState<{
    props: DialogOptions | null;
    isVisible: boolean;
    resolve?: () => void;
  }>({
    props: null,
    isVisible: false,
  });

  const hide = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const handleAnimationComplete = useCallback((visible: boolean) => {
    if (!visible) {
      setDialogState((prev) => ({
        ...prev,
        props: null,
        resolve: undefined,
      }));
    }
  }, []);

  const show = useCallback(
    (props: DialogOptions): Promise<void> => {
      return new Promise<void>((resolve) => {
        const handleAccept = () => {
          hide();
          props.onAccept?.();
          resolve();
        };

        setDialogState({
          props: { ...props, onAccept: handleAccept },
          isVisible: true,
          resolve,
        });
      });
    },
    [hide],
  );

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (dialogState.resolve) {
        dialogState.resolve();
      }
    };
  }, [dialogState.resolve]);

  return (
    <DialogContext.Provider value={{ show, hide }}>
      {children}
      {dialogState.props && (
        <Dialog
          {...dialogState.props}
          isVisible={dialogState.isVisible}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </DialogContext.Provider>
  );
};

export const useDialogController = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
