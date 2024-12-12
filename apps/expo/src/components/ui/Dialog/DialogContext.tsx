import React, { createContext, useCallback, useContext, useState } from "react";

import type { DialogProps } from "./Dialog";
import { Dialog } from "./Dialog";

type DialogOptions = Omit<DialogProps, "isVisible">;

interface DialogContextValue {
  show: (props: DialogOptions) => Promise<void>;
  hide: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [dialogProps, setDialogProps] = useState<DialogOptions | null>(null);

  const hide = useCallback(() => {
    setDialogProps(null);
  }, []);

  const show = useCallback(
    (props: DialogOptions): Promise<void> => {
      return new Promise((resolve) => {
        setDialogProps({
          ...props,
          onAccept: () => {
            hide();
            resolve();
          },
        });
      });
    },
    [hide],
  );

  return (
    <DialogContext.Provider value={{ show, hide }}>
      {children}
      {dialogProps && <Dialog {...dialogProps} isVisible={!!dialogProps} />}
    </DialogContext.Provider>
  );
};

export const useDialogController = () => {
  const context = useContext(DialogContext);
  if (!context)
    throw new Error("useDialog must be used within a DialogProvider");
  return context;
}; 