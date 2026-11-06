import type { PlatformStatus } from "@discordia/client-shared";
import {
  CircleCheck,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface StatusTone {
  icon: LucideIcon;
  bar: string;
  panel: string;
  soft: string;
  accent: string;
  ink: string;
}

export const STATUS_TONES: Record<PlatformStatus, StatusTone> = {
  operational: {
    icon: CircleCheck,
    bar: "bg-status-bar-operational",
    panel: "bg-success/10 border-success/30",
    soft: "bg-success/15 text-success",
    accent: "bg-success",
    ink: "text-success",
  },
  degraded: {
    icon: TriangleAlert,
    bar: "bg-status-bar-degraded",
    panel: "bg-warning/10 border-warning/30",
    soft: "bg-warning/15 text-warning",
    accent: "bg-warning",
    ink: "text-warning",
  },
  maintenance: {
    icon: Wrench,
    bar: "bg-status-bar-maintenance",
    panel: "bg-info/10 border-info/30",
    soft: "bg-info/15 text-info",
    accent: "bg-info",
    ink: "text-info",
  },
};
