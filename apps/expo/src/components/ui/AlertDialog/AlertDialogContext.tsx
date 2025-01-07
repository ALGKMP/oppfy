import React, { createContext, useCallback, useContext, useState } from "react";

import type { AlertDialogProps } from "./AlertDialog";
import { AlertDialog } from "./AlertDialog";

type AlertDialogOptions = Omit<AlertDialogProps, "isVisible">;

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
  const [dialogProps, setDialogProps] = useState<AlertDialogOptions | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);

  const hide = useCallback(() => {
    setIsVisible(false);
    // We'll let the animation complete before clearing the props
    setTimeout(() => {
      setDialogProps(null);
    }, 300); // slightly longer than animation duration to ensure completion
  }, []);

  const show = useCallback(
    (props: AlertDialogOptions): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogProps({
          ...props,
          onAccept: () => {
            hide();
            resolve(true);
          },
          onCancel: () => {
            hide();
            resolve(false);
          },
        });
        setIsVisible(true);
      });
    },
    [hide],
  );

  return (
    <AlertDialogContext.Provider value={{ show, hide }}>
      {children}
      {dialogProps && <AlertDialog {...dialogProps} isVisible={isVisible} />}
    </AlertDialogContext.Provider>
  );
};

export const useAlertDialogController = () => {
  const context = useContext(AlertDialogContext);
  if (!context)
    throw new Error(
      "useAlertDialog must be used within an AlertDialogProvider",
    );
  return context;
};
