/**
 * TEMPORAL: verifica que @discordia/client-shared resuelve, typechequea y se
 * puede importar desde web-client. Se borra al terminar la Fase 0, cuando el
 * paquete empiece a exportar tipos y validaciones de verdad.
 */
import { SHARED_VERSION } from "@discordia/client-shared";

export const sharedSmokeTest: string = SHARED_VERSION;
