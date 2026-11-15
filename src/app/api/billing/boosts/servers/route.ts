import { BOOSTS_LIST_LOAD_ERROR } from "@discordia/client-shared";

import { NextResponse } from "next/server";

import { unauthorizedResponse } from "@/lib/apiRoute";
import { getValidSession } from "@/services/auth/session";
import { listBoostedServers } from "@/services/billing/service";
import type { BoostedServersPageResult } from "@/types/billing.types";

import { billingFailureResponse, pageParamsOf } from "../../billingRoute";

/** BFF de `GET /v1/billing/boosts/servers`: una página de los servidores que boosteé. */
export async function GET(
  request: Request,
): Promise<NextResponse<BoostedServersPageResult>> {
  const session = await getValidSession();
  if (!session) return unauthorizedResponse();

  const result = await listBoostedServers(
    session.token,
    pageParamsOf(request, ["limit", "offset"]),
  );
  if (!result.ok) return billingFailureResponse(result, BOOSTS_LIST_LOAD_ERROR);

  return NextResponse.json({ ok: true, page: result.data });
}
