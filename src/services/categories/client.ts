import {
  CATEGORY_CREATE_FAILED,
  CATEGORY_UPDATE_FAILED,
} from "@discordia/client-shared";

import { api } from "@/lib/browser-api-client";

import type {
  CreateCategoryActionResult,
  UpdateCategoryActionResult,
} from "@/types/category.types";

/**
 * Llamadas del navegador hacia el BFF (`/api/categories`, `/api/servers/:id/categories`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function createCategoryRequest(
  serverId: string,
  name: string,
): Promise<CreateCategoryActionResult> {
  try {
    const { data } = await api.post<CreateCategoryActionResult>(
      `/servers/${serverId}/categories`,
      { name },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CATEGORY_CREATE_FAILED,
    };
  }
}

export async function updateCategoryRequest(
  categoryId: string,
  name: string,
): Promise<UpdateCategoryActionResult> {
  try {
    const { data } = await api.patch<UpdateCategoryActionResult>(
      `/categories/${categoryId}`,
      { name },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CATEGORY_UPDATE_FAILED,
    };
  }
}
