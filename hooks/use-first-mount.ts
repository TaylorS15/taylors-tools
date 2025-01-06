import { useEffect, useState } from "react";

export default function useFirstMount() {
  const [initialLoad, setInitialLoad] = useState(false);

  useEffect(() => {
    if (!initialLoad) {
      setInitialLoad(true);
    }
  }, []);

  return { hasLoaded: initialLoad };
}
