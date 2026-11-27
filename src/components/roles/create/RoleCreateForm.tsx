"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsFormFooter } from "@/components/ui/settings/SettingsFormFooter";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";

import { type RolesEditor } from "../hooks/useRolesEditor";
import { ColorPicker, FieldError } from "../shared/ColorPicker";
import { PermissionGroups } from "../shared/PermissionGroups";
import { RoleNameField } from "../shared/RoleNameField";
import { FieldLabel } from "@/components/ui/FieldLabel";

const NAME_INPUT_ID = "role-create-name";

interface RoleCreateFormProps {
  editor: RolesEditor;
  backButton?: ReactNode;
}

export function RoleCreateForm({ editor, backButton }: RoleCreateFormProps) {
  const {
    newName,
    setNewName,
    newColor,
    setNewColor,
    newPerms,
    newNameError,
    setNewNameError,
    newColorError,
    setNewColorError,
    creating,
    handleToggleNewPerm,
    handleCreate,
    backToList,
    error,
  } = editor;

  return (
    <SettingsSection
      description="Arranca con los mismos permisos que @everyone. Podés ajustarlos antes de crear o después."
      toolbar={backButton}
      footer={
        <SettingsFormFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={backToList}
            className="w-auto px-4 py-2"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            isLoading={creating}
            className="w-auto px-4 py-2"
          >
            Crear rol
          </Button>
        </SettingsFormFooter>
      }
    >
      <div className="space-y-8">
        <FormAlert message={error} />
        <RoleNameField
          inputId={NAME_INPUT_ID}
          value={newName}
          color={newColor}
          error={newNameError}
          autoFocus
          onChange={(value) => {
            setNewName(value);
            setNewNameError("");
          }}
        />

        <SettingsGroup label={<FieldLabel required>Color</FieldLabel>}>
          <ColorPicker
            value={newColor}
            onChange={(color) => {
              setNewColor(color);
              setNewColorError("");
            }}
          />
          <FieldError message={newColorError} />
        </SettingsGroup>

        <PermissionGroups enabled={newPerms} onToggle={handleToggleNewPerm} />
      </div>
    </SettingsSection>
  );
}
