"use client";

import { Pencil } from "lucide-react";

import { Tooltip } from "@/components/ui/Tooltip";

interface EditFieldButtonProps {
  label: string;
  onClick: () => void;
}

export function EditFieldButton({ label, onClick }: EditFieldButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="text-content-subtle hover:text-accent-strong hover:bg-surface-hover focus-visible:ring-accent flex size-6 cursor-pointer items-center justify-center rounded-md transition focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none sm:opacity-0 sm:group-hover/field:opacity-100"
      >
        <Pencil size={13} />
      </button>
    </Tooltip>
  );
}
