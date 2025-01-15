import React, { createContext, useCallback, useContext, useState } from "react";

import { BottomSheet } from "./BottomSheet";
import type { BottomSheetProps } from "./BottomSheet";

type BottomSheetOptions = Omit<BottomSheetProps, "isVisible">;

interface BottomSheetContextValue {
  show: (props: BottomSheetOptions) => void;
  hide: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextValue | null>(null);

export const BottomSheetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [sheetProps, setSheetProps] = useState<BottomSheetOptions | null>(null);

  const hide = useCallback(() => {
    setIsVisible(false);
  }, []);

  const show = useCallback((props: BottomSheetOptions) => {
    setSheetProps(props);
    setIsVisible(true);
  }, []);

  return (
    <BottomSheetContext.Provider value={{ show, hide }}>
      {children}
      {sheetProps && (
        <BottomSheet {...sheetProps} isVisible={isVisible} onDismiss={hide} />
      )}
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheetController = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    console.warn(
      "useBottomSheetController was called outside of BottomSheetProvider. Some features may not work.",
    );
    return {
      show: () => {},
      hide: () => {},
    };
  }
  return context;
};
