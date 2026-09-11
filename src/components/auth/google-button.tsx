import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";

/**
 * Login con Google. El backend todavia no expone `POST /v1/auth/oauth/google`,
 * asi que por ahora queda deshabilitado y visible (esta en el diseno).
 */
export function GoogleButton() {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled
      title="Disponible proximamente"
    >
      <GoogleIcon size={18} />
      <span>Continuar con Google</span>
    </Button>
  );
}
