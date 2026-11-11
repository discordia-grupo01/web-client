import {
  type ApiErrorDetails,
  BOOST_PERK_LEVEL,
  boostLevelRequiredMessage,
  type DeleteServerFieldErrors,
  fieldOf,
  reasonOf,
  requiredBoostLevelOf,
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

const BOOST_LEVEL_FIELD: Partial<
  Record<number, keyof UpdateServerFieldErrors>
> = {
  [BOOST_PERK_LEVEL.animated_icon]: "icon",
  [BOOST_PERK_LEVEL.custom_banner]: "banner",
};

export function boostLevelErrorResponse(
  failure: ServerServiceFailure,
): { payload: ServerErrorPayload; status: number } | undefined {
  const level = requiredBoostLevelOf(failure.details);
  if (level === undefined) return undefined;

  const message = boostLevelRequiredMessage(level);
  const field = BOOST_LEVEL_FIELD[level];
  return {
    payload: field
      ? { ok: false, message, fieldErrors: { [field]: message } }
      : { ok: false, message },
    status: 403,
  };
}

export interface DeleteServerErrorPayload {
  ok: false;
  message: string;
  fieldErrors?: DeleteServerFieldErrors;
}

function isDeleteServerField(
  field: string | undefined,
): field is keyof DeleteServerFieldErrors {
  return field === "confirm_name";
}

// TODO: refactorizar, usar directamente serverErrorResponse
export function deleteServerErrorResponse(
  failure: ServerServiceFailure,
  fallback: string,
): { payload: DeleteServerErrorPayload; status: number } {
  const reason = reasonOf(failure.details);
  const friendly = reason ? SERVER_REASONS[reason] : undefined;
  const field = fieldOf(failure.details);

  if (friendly && isDeleteServerField(field)) {
    return {
      payload: {
        ok: false,
        message: friendly,
        fieldErrors: { [field]: friendly },
      },
      status: failure.status || 400,
    };
  }

  const status =
    failure.status >= 400 && failure.status < 500 ? failure.status : 502;
  return { payload: { ok: false, message: fallback }, status };
}
