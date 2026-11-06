import { Check } from "lucide-react";

import { BILLING_COPY } from "./billingCopy";

export function PremiumFacts() {
  return (
    <ul className="border-line flex flex-col gap-2 border-t pt-5">
      {BILLING_COPY.showcaseFacts.map((fact) => (
        <li
          key={fact}
          className="text-content-muted flex items-start gap-2 text-xs leading-relaxed"
        >
          <Check size={14} className="text-sky mt-px shrink-0" />
          {fact}
        </li>
      ))}
    </ul>
  );
}
