import type { PlatformStatus } from "@discordia/client-shared";
import {
  CircleCheck,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface StatusTone {
  icon: LucideIcon;
  surface: string;
  bar: string;
  text: string;
  chip: string;
}

export const STATUS_TONES: Record<PlatformStatus, StatusTone> = {
  operational: {
    icon: CircleCheck,
    surface: "bg-success/8 border-success/30",
    bar: "bg-status-bar-operational",
    text: "text-success-readable",
    chip: "bg-success/15 text-success-readable",
  },
  degraded: {
    icon: TriangleAlert,
    surface: "bg-warning/8 border-warning/30",
    bar: "bg-status-bar-degraded",
    text: "text-warning-readable",
    chip: "bg-warning/15 text-warning-readable",
  },
  maintenance: {
    icon: Wrench,
    surface: "bg-info/8 border-info/30",
    bar: "bg-status-bar-maintenance",
    text: "text-info",
    chip: "bg-info/15 text-info",
  },
};
