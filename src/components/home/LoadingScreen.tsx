import { LogoLoader } from "@/components/ui/LogoLoader";

interface LoadingScreenProps {
  isLeaving?: boolean;
}

/**
 * Pantalla de carga inicial: se muestra hasta que responden los servicios
 * del home, para no mostrar estados vacios que luego se corrigen.
 */
export function LoadingScreen({ isLeaving = false }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-dvh w-full flex-col items-center justify-center transition-opacity duration-200"
      style={{ background: "var(--bg-chat)", opacity: isLeaving ? 0 : 1 }}
    >
      <LogoLoader />
      <span className="sr-only">Cargando</span>
    </div>
  );
}
