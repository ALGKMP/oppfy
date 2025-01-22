import { useEffect, useState } from "react";

interface CooldownOptions {
  autoStart?: boolean;
}

const useCooldown = (
  duration: number,
  { autoStart = false }: CooldownOptions = {},
) => {
  const [cooldown, setCooldown] = useState(autoStart ? duration : 0);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    if (!isActive) return;

    if (cooldown <= 0) {
      setIsActive(false);
      return;
    }

    const timer = setTimeout(() => {
      setCooldown((currentCooldown) => currentCooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isActive, cooldown]);

  const startCooldown = () => {
    if (cooldown <= 0) setCooldown(duration);
    setIsActive(true);
  };

  const pauseCooldown = () => {
    setIsActive(false);
  };

  const resetCooldown = () => {
    setCooldown(duration);
    setIsActive(autoStart);
  };

  return { cooldown, startCooldown, pauseCooldown, resetCooldown };
};

export default useCooldown;
