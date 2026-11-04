import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function CallBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 justify-center px-4 pb-2">
      <p className="bg-highlight/15 text-content flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
        <TriangleAlert size={15} className="text-highlight shrink-0" />
        {children}
      </p>
    </div>
  );
}
