import { useEffect } from "react";

export const usePreventUnload = ({
  enabled,
  message = "Changes you made may not be saved.",
}: {
  enabled: boolean;
  message?: string;
}) => {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, message]);
};
