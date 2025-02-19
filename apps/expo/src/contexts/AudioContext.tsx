import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

const AudioProvider = ({ children }: AudioProviderProps) => {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  }, []);

  const toggleMute = (): void => {
    setIsMuted((prevMuted) => !prevMuted);
  };

  const value: AudioContextType = {
    isMuted,
    toggleMute,
  };

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
};

const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};

export { AudioProvider, useAudio };
