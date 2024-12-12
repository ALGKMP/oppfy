import React, { createContext, useCallback, useContext, useState } from "react";
import {
  runOnJS,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { AlertDialogNewProps } from "./AlertDialogNew";
import { AlertDialogNew } from "./AlertDialogNew";

type DialogProps = Omit<AlertDialogNewProps, "isVisible" | "animation">;

interface DialogContextValue {
  showDialog: (props: DialogProps) => void;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export const DialogProviderNew: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [dialogProps, setDialogProps] = useState<DialogProps | null>(null);
  const animation = useSharedValue(0);

  const showDialog = useCallback(
    (props: DialogProps) => {
      setDialogProps(props);
      animation.value = withSpring(1, { damping: 15, stiffness: 200 });
    },
    [animation],
  );

  const hideDialog = useCallback(() => {
    animation.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(setDialogProps)(null);
      }
    });
  }, [animation]);

  return (
    <DialogContext.Provider value={{ showDialog, hideDialog }}>
      {children}
      {dialogProps && (
        <AlertDialogNew
          {...dialogProps}
          isVisible={true}
          animation={animation}
        />
      )}
    </DialogContext.Provider>
  );
};

export const useDialogNew = () => {
  const context = useContext(DialogContext);
  if (!context)
    throw new Error("useDialogNew must be used within a DialogProviderNew");
  return context;
};
