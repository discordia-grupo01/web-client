"use client";

import {
  EVERYONE_VIEW_CHANNELS_OFF_BODY,
  EVERYONE_VIEW_CHANNELS_OFF_CONFIRM,
  EVERYONE_VIEW_CHANNELS_OFF_TITLE,
  ROLES_SECTION_TITLE,
  type Role,
} from "@discordia/client-shared";
import { ChevronLeft, EyeOff, Plus } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useSettingsSubPage } from "@/components/ui/settings/SettingsModalContext";
import { SettingsGroup } from "@/components/ui/settings/SettingsGroup";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";

import { RoleCreateForm } from "./create/RoleCreateForm";
import { RoleEditForm } from "./edit/RoleEditForm";
import { useRolesEditor } from "./hooks/useRolesEditor";
import { RolesList } from "./list/RolesList";

export interface RolesPanelProps {
  serverId: string;
  serverName: string;
  isOwner: boolean;
  myRoles: Role[];
}

export function RolesPanel({ serverId, isOwner, myRoles }: RolesPanelProps) {
  const editor = useRolesEditor({ serverId, isOwner, myRoles });

  const {
    view,
    rightView,
    selectedRole,
    backToList,
    openCreateForm,
    isLoading,
    toast,
    isConfirmingEveryoneView,
    setIsConfirmingEveryoneView,
    handleSave,
  } = editor;

  const isCreating = view === "detail" && rightView === "create";
  const openRole = view === "detail" && !isCreating ? selectedRole : undefined;
  const subPageTitle = isCreating ? "Crear rol" : openRole?.name;

  const isInsideSettingsModal = useSettingsSubPage(
    subPageTitle
      ? { parent: ROLES_SECTION_TITLE, title: subPageTitle, onBack: backToList }
      : null,
  );

  const backButton = isInsideSettingsModal ? undefined : (
    <button
      type="button"
      onClick={backToList}
      className="text-content-muted hover:text-content -ml-2 flex cursor-pointer items-center gap-1 rounded-xl px-2 py-1.5 text-sm font-semibold"
    >
      <ChevronLeft size={18} />
      {ROLES_SECTION_TITLE}
    </button>
  );

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
      {isCreating ? (
        <RoleCreateForm editor={editor} backButton={backButton} />
      ) : openRole ? (
        <RoleEditForm
          serverId={serverId}
          editor={editor}
          backButton={backButton}
        />
      ) : (
        <SettingsSection
          description={
            editor.showRoleGripColumn
              ? "Arrastrá un rol para cambiar su lugar en la jerarquía."
              : "Definí qué puede hacer cada miembro del servidor."
          }
        >
          <SettingsGroup
            label="Roles del servidor"
            count={editor.roles?.length}
            aside={
              <Button
                type="button"
                onClick={openCreateForm}
                disabled={isLoading}
                className="w-auto shrink-0 px-3.5 py-2"
              >
                <Plus size={16} />
                Crear rol
              </Button>
            }
          >
            <RolesList editor={editor} />
          </SettingsGroup>
        </SettingsSection>
      )}

      <div
        className="bg-surface-raised border-line-strong pointer-events-none absolute left-1/2 flex min-w-[200px] -translate-x-1/2 items-center gap-2.5 rounded-xl border px-4 py-2.5 shadow-xl transition-all duration-300"
        style={{
          bottom: toast ? 20 : -60,
          opacity: toast ? 1 : 0,
          zIndex: 999,
        }}
      >
        <span className="bg-accent size-2 shrink-0 rounded-full" />
        <p className="text-content font-display text-sm font-semibold">
          {toast}
        </p>
      </div>

      {isConfirmingEveryoneView ? (
        <ConfirmDialog
          icon={EyeOff}
          title={EVERYONE_VIEW_CHANNELS_OFF_TITLE}
          body={EVERYONE_VIEW_CHANNELS_OFF_BODY}
          confirmLabel={EVERYONE_VIEW_CHANNELS_OFF_CONFIRM}
          onConfirm={() => void handleSave()}
          onCancel={() => setIsConfirmingEveryoneView(false)}
        />
      ) : null}
    </div>
  );
}
