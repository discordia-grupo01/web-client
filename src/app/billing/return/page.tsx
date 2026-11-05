import { parsePaymentReturn } from "@discordia/client-shared";
import type { Metadata } from "next";

import { PaymentReturnView } from "@/components/billing/PaymentReturnView";

import { flattenReturnQuery } from "./returnQuery";

export const metadata: Metadata = {
  title: "Resultado del pago",
};

/**
 * A donde Mercado Pago devuelve al usuario después de pagar
 * (`CHECKOUT_RETURN_URL` + `/billing/return` en billing). Protegida por el
 * middleware: sin sesión pasa por el login y vuelve con el mismo query.
 */
export default function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  return (
    <PaymentReturnView
      params={parsePaymentReturn(flattenReturnQuery(searchParams))}
    />
  );
}
