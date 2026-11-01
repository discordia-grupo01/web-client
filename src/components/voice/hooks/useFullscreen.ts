import { useCallback, useEffect, useRef, useState } from "react";

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Recien en el cliente: en el server no hay `document`.
    setIsSupported(document.fullscreenEnabled === true);
    const onChange = () =>
      setIsFullscreen(
        ref.current !== null && document.fullscreenElement === ref.current,
      );
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const enter = useCallback(() => {
    // El navegador puede negarlo (por ejemplo sin un gesto del usuario): queda
    // la vista normal y no hay nada que avisar.
    ref.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const exit = useCallback(() => {
    if (!ref.current || document.fullscreenElement !== ref.current) return;
    document.exitFullscreen().catch(() => undefined);
  }, []);

  return { ref, isSupported, isFullscreen, enter, exit };
}
