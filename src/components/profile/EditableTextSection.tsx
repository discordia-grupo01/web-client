"use client";

import { useState } from "react";

import { InlineTextEditor } from "@/components/ui/InlineTextEditor";
import { SectionLabel } from "@/components/ui/SectionLabel";

import { EditFieldButton } from "./EditFieldButton";

interface EditableTextSectionProps {
  label: string;
  value: string;
  emptyText: string;
  editLabel: string;
  maxLength: number;
  placeholder?: string;
  multiline?: boolean;
  onSave: (draft: string) => Promise<string | null>;
}

export function EditableTextSection({
  label,
  value,
  emptyText,
  editLabel,
  maxLength,
  placeholder,
  multiline,
  onSave,
}: EditableTextSectionProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <InlineTextEditor
        initialValue={value}
        maxLength={maxLength}
        label={label}
        placeholder={placeholder}
        multiline={multiline}
        onSave={onSave}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="group/field">
      <div className="mb-1.5 flex min-h-6 items-center gap-1.5">
        <SectionLabel>{label}</SectionLabel>
        <EditFieldButton label={editLabel} onClick={() => setIsEditing(true)} />
      </div>
      <p className="text-content-muted text-sm leading-relaxed break-words">
        {value || emptyText}
      </p>
    </div>
  );
}
