import {
  CATEGORY_CREATE_FAILED,
  CATEGORY_REORDER_FAILED,
  CATEGORY_UPDATE_FAILED,
  type CreateCategoryResult,
  type ReorderCategoriesResult,
  type UpdateCategoryResult,
} from "@discordia/client-shared";

import { api } from "@/lib/browserApiClient";

/**
 * Llamadas del navegador hacia el BFF (`/api/categories`, `/api/servers/:id/categories`,
 * mismo origen). Nunca pega directo al gateway: el JWT nunca sale del
 * servidor de Next.
 */

export async function createCategoryRequest(
  serverId: string,
  name: string,
): Promise<CreateCategoryResult> {
  try {
    const { data } = await api.post<CreateCategoryResult>(
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
): Promise<UpdateCategoryResult> {
  try {
    const { data } = await api.patch<UpdateCategoryResult>(
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

export async function reorderCategoriesRequest(
  serverId: string,
  categoryIds: string[],
): Promise<ReorderCategoriesResult> {
  try {
    const { data } = await api.patch<ReorderCategoriesResult>(
      `/servers/${serverId}/categories/reorder`,
      { categoryIds },
    );
    return data;
  } catch {
    return {
      ok: false,
      message: CATEGORY_REORDER_FAILED,
    };
  }
}
