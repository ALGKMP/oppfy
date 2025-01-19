import React, { createContext, useCallback, useContext, useState } from "react";

import type { AlertDialogProps } from "./AlertDialog";
import { AlertDialog } from "./AlertDialog";

type AlertDialogOptions = Omit<
  AlertDialogProps,
  "isVisible" | "onAnimationComplete"
>;

interface AlertDialogContextValue {
  show: (props: AlertDialogOptions) => Promise<boolean>;
  hide: () => void;
}

const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

export const AlertDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [dialogState, setDialogState] = useState<{
    props: AlertDialogOptions | null;
    isVisible: boolean;
    resolve?: (value: boolean) => void;
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
    (props: AlertDialogOptions): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        const handleAccept = () => {
          hide();
          props.onAccept?.();
          resolve(true);
        };

        const handleCancel = () => {
          hide();
          props.onCancel?.();
          resolve(false);
        };

        setDialogState({
          props: { ...props, onAccept: handleAccept, onCancel: handleCancel },
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
        dialogState.resolve(false);
      }
    };
  }, [dialogState.resolve]);

  return (
    <AlertDialogContext.Provider value={{ show, hide }}>
      {children}
      {dialogState.props && (
        <AlertDialog
          {...dialogState.props}
          isVisible={dialogState.isVisible}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </AlertDialogContext.Provider>
  );
};

export const useAlertDialogController = () => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      "useAlertDialog must be used within an AlertDialogProvider",
    );
  }
  return context;
};
