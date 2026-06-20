import { useEffect, useState } from "react";
const loadedKeys: Record<string, boolean> = {};

export function useLoadingSimulation(key: string, delay: number = 700) {
  const [loading, setLoading] = useState(!loadedKeys[key]);

  useEffect(() => {
    if (!loadedKeys[key]) {
      const timer = setTimeout(() => {
        setLoading(false);
        loadedKeys[key] = true;
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [key, delay]);

  return loading;
}
