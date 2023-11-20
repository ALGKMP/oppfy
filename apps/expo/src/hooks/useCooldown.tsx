import { useEffect, useState } from "react";

interface CooldownOptions {
  autoStart?: boolean;
}

const useCooldown = (
  duration: number,
  { autoStart: startActive = false }: CooldownOptions = {},
) => {
  const [cooldown, setCooldown] = useState(duration);
  const [isActive, setIsActive] = useState(startActive);

  useEffect(() => {
    if (!isActive || cooldown <= 0) {
      setIsActive(false);
      return;
    }

    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [isActive, cooldown]);

  const startCooldown = () => {
    setCooldown(duration);
    setIsActive(true);
  };

  const resetCooldown = () => {
    setIsActive(false);
  };

  return { cooldown, startCooldown, resetCooldown };
};

export default useCooldown;
