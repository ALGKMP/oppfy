import React, { createContext, useContext, useState } from "react";

interface CelebrationData {
  recipientName: string;
  recipientImage?: string;
}

interface CelebrationContextType {
  showCelebration: (data: CelebrationData) => void;
  celebrationData: CelebrationData | null;
  isVisible: boolean;
  hideCelebration: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(
  undefined,
);

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [celebrationData, setCelebrationData] =
    useState<CelebrationData | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showCelebration = (data: CelebrationData) => {
    setCelebrationData(data);
    setIsVisible(true);
  };

  const hideCelebration = () => {
    setIsVisible(false);
    // Clear data after animation completes
    setTimeout(() => {
      setCelebrationData(null);
    }, 300);
  };

  return (
    <CelebrationContext.Provider
      value={{
        showCelebration,
        celebrationData,
        isVisible,
        hideCelebration,
      }}
    >
      {children}
    </CelebrationContext.Provider>
  );
};

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
};
