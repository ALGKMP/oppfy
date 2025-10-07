import { useEffect, useState } from "react";

export function useIsMobile() {
  const [state, setState] = useState(true);

  useEffect(() => {
    const fn = () => setState(window.innerWidth < 768);
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  return state;
}
