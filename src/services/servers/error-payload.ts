import {
  type ApiErrorDetails,
  fieldOf,
  reasonOf,
  SERVER_REASONS,
  type UpdateServerFieldErrors,
} from "@discordia/client-shared";

export interface ServerErrorPayload {
  ok: false;
  message: string;
  fieldErrors?: UpdateServerFieldErrors;
}

/** Los campos que el backend puede marcar en un alta o edicion de servidor. */
function isServerField(
  field: string | undefined,
): field is keyof UpdateServerFieldErrors {
  return field === "name" || field === "icon" || field === "banner";
}

interface ServerServiceFailure {
  status: number;
  details?: ApiErrorDetails;
}

export function serverErrorResponse(
  failure: ServerServiceFailure,
  fallback: string,
): { payload: ServerErrorPayload; status: number } {
  const reason = reasonOf(failure.details);
  const friendly = reason ? SERVER_REASONS[reason] : undefined;
  const field = fieldOf(failure.details);

  if (friendly && isServerField(field)) {
    return {
      payload: {
        ok: false,
        message: friendly,
        fieldErrors: { [field]: friendly },
      },
      status: failure.status || 400,
    };
  }

  // Un 5xx (o un 0 de "no hubo respuesta") no se reenvia tal cual: para el
  // navegador el BFF fue el que no pudo hablar con el backend.
  const status =
    failure.status >= 400 && failure.status < 500 ? failure.status : 502;
  return { payload: { ok: false, message: fallback }, status };
}
