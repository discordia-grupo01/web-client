"use client";

import { MAX_NAME } from "@discordia/client-shared";

import { useState } from "react";

import { PremiumPill } from "@/components/billing/premium/PremiumPill";
import { InlineTextEditor } from "@/components/ui/InlineTextEditor";

import { EditFieldButton } from "./EditFieldButton";

interface ProfileNameFieldProps {
  name: string;
  isPremium: boolean;
  onSave: (name: string) => Promise<string | null>;
}

export function ProfileNameField({
  name,
  isPremium,
  onSave,
}: ProfileNameFieldProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <InlineTextEditor
        initialValue={name}
        maxLength={MAX_NAME}
        label="Nombre"
        hideLabel
        onSave={onSave}
        onClose={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="group/field flex flex-wrap items-center gap-1.5">
      <h2 className="font-display text-content text-lg font-bold">{name}</h2>
      {isPremium ? <PremiumPill /> : null}
      <EditFieldButton
        label="Editar nombre"
        onClick={() => setIsEditing(true)}
      />
    </div>
  );
}
