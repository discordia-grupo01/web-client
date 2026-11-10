import type { BillingTone } from "@discordia/client-shared";

export const BILLING_TONE_CLASS: Record<BillingTone, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
  muted: "bg-surface-input text-content-subtle",
};
