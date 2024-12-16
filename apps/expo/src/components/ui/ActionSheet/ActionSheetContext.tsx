import React, { createContext, useCallback, useContext, useState } from "react";

import type { ActionSheetProps } from "./ActionSheet";
import { ActionSheet } from "./ActionSheet";

type ActionSheetOptions = Omit<ActionSheetProps, "isVisible">;

interface ActionSheetContextValue {
  show: (props: ActionSheetOptions) => void;
  hide: () => void;
}

const ActionSheetContext = createContext<ActionSheetContextValue | null>(null);

export const ActionSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sheetProps, setSheetProps] = useState<ActionSheetOptions | null>(null);

  const hide = useCallback(() => {
    setSheetProps(null);
  }, []);

  const show = useCallback(
    (props: ActionSheetOptions) => {
      setSheetProps({
        ...props,
        onCancel: () => {
          props.onCancel?.();
          hide();
        },
      });
    },
    [hide],
  );

  return (
    <ActionSheetContext.Provider value={{ show, hide }}>
      {children}
      {sheetProps && <ActionSheet {...sheetProps} isVisible={!!sheetProps} />}
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
