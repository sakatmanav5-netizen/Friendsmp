import { useEffect } from "react";
import { useLiveExtras } from "@/lib/live-content";
import { applyDesignVars } from "@/lib/design-tokens";

export function DesignVarsApplier() {
  const extras = useLiveExtras();

  useEffect(() => {
    applyDesignVars(extras.design);
  }, [extras.design]);

  return null;
}
