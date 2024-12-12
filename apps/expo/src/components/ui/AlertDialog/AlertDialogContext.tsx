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

  const hide = useCallback(() => {
    setDialogProps(null);
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
      });
    },
    [hide],
  );

  return (
    <AlertDialogContext.Provider value={{ show, hide }}>
      {children}
      {dialogProps && (
        <AlertDialog {...dialogProps} isVisible={!!dialogProps} />
      )}
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
