
import { useEffect, useRef } from "react";

/**
 * Calls resetFn when watchValue changes, skipping the initial mount.
 */
export function useFilterReset(watchValue: unknown, resetFn: () => void) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    resetFn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchValue]);
}
