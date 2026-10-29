"use client";

import {
  ALLOWED_SERVER_ICON_TYPES,
  formatImageTypes,
  MAX_ICON_FILE_MB,
} from "@discordia/client-shared";
import { type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { SectionLabel } from "@/components/ui/SectionLabel";

import { type ServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import { ServerNameField } from "../ServerNameField";
import { BannerPresetPicker } from "./BannerPresetPicker";
import { ServerIdentityEditor } from "./ServerIdentityEditor";

const NAME_INPUT_ID = "server-settings-name";

interface ServerProfileFormProps {
  form: ServerSettingsForm;
  serverName: string;
  titleId: string;
  onCancel: () => void;
}

export function ServerProfileForm({
  form,
  serverName,
  titleId,
  onCancel,
}: ServerProfileFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
      <div className="px-4 pt-6 pb-2 sm:px-7 sm:pt-8">
        <h2
          id={titleId}
          className="font-display text-content mb-1 text-xl font-bold"
        >
          Perfil del servidor
        </h2>
        <p className="text-content-muted text-sm leading-relaxed">
          Actualizá la identidad visual de tu comunidad.
        </p>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-7">
        <FormAlert message={form.globalError} />

        <div>
          <SectionLabel>Identidad del servidor</SectionLabel>
          <div className="mt-2">
            <ServerIdentityEditor
              serverName={form.name || serverName}
              iconSrc={form.iconPreviewSrc}
              bannerSrc={form.bannerPreviewSrc}
              bannerGradient={form.bannerPreviewGradient}
              hasBanner={form.hasBanner}
              onPickIcon={form.pickIcon}
              onPickBanner={form.pickBanner}
              onRemoveBanner={form.removeBanner}
            />
          </div>
          <FieldError message={form.iconError} />
          <FieldError message={form.bannerError} />
          <p className="text-content-subtle mt-2 text-[11px]">
            {formatImageTypes(ALLOWED_SERVER_ICON_TYPES)} · Máx.{" "}
            {MAX_ICON_FILE_MB} MB
          </p>
        </div>

        <BannerPresetPicker
          selectedId={form.selectedPresetId}
          onSelect={form.choosePreset}
        />

        <ServerNameField
          inputId={NAME_INPUT_ID}
          value={form.name}
          error={form.nameError}
          onChange={form.changeName}
        />
      </div>

      <div className="border-line flex items-center justify-end gap-3 border-t px-4 py-5 sm:px-7">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!form.canSubmit}
          isLoading={form.isSubmitting}
          className="w-auto"
        >
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
