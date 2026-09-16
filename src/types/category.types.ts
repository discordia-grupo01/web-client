/** Categoria tal como viene embebida en la respuesta de un servidor. */
export interface Category {
  id: string;
  server_id: string;
  name: string;
  position: number;
}

export interface CategoryFieldErrors {
  name?: string;
}

/** Resultado de `POST /api/servers/:id/categories`. */
export type CreateCategoryActionResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };

/** Resultado de `PATCH /api/categories/:id`. */
export type UpdateCategoryActionResult =
  | { ok: true; category: Category }
  | { ok: false; message: string; fieldErrors?: CategoryFieldErrors };
