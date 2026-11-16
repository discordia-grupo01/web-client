"use client";

import {
  canUseAnimatedServerIcon,
  SERVER_BANNER_BENEFIT_COPY,
  serverIconFormatsHint,
} from "@discordia/client-shared";
import { type FormEvent, type ReactNode } from "react";

import { BoostBenefitField } from "@/components/boosts/benefits/BoostBenefitField";
import { BoostProgressStrip } from "@/components/boosts/status/BoostProgressStrip";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";

import { type ServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import { ServerNameField } from "../ServerNameField";
import { AnimatedIconField } from "./AnimatedIconField";
import { BannerPresetPicker } from "./BannerPresetPicker";
import { ServerIdentityEditor } from "./ServerIdentityEditor";

const NAME_INPUT_ID = "server-settings-name";

interface ServerProfileFormProps {
  form: ServerSettingsForm;
  serverName: string;
  titleId: string;
  onCancel: () => void;
  onBoost?: () => void;
  /** "Ver qué suma cada nivel": Boosts del servidor en la pestaña Beneficios. */
  onShowBenefits?: () => void;
  /** URL de invitación personalizada: se guarda aparte, con su propio botón. */
  vanityField?: ReactNode;
}

export function ServerProfileForm({
  form,
  serverName,
  titleId,
  onCancel,
  onBoost,
  onShowBenefits,
  vanityField,
}: ServerProfileFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  const displayName = form.name || serverName;

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

      <div className="space-y-6 px-4 py-5 sm:px-7">
        <FormAlert message={form.globalError} />

        <BoostProgressStrip
          level={form.boostLevel}
          boostCount={form.boostCount}
          onBoost={onBoost}
          onShowBenefits={onShowBenefits}
        />

        <ServerNameField
          inputId={NAME_INPUT_ID}
          value={form.name}
          error={form.nameError}
          onChange={form.changeName}
        />

        <BoostBenefitField
          perk="custom_banner"
          level={form.boostLevel}
          boostCount={form.boostCount}
          title={SERVER_BANNER_BENEFIT_COPY.title}
        >
          <ServerIdentityEditor
            serverName={displayName}
            iconSrc={form.iconPreviewSrc}
            bannerSrc={form.bannerPreviewSrc}
            bannerGradient={form.bannerPreviewGradient}
            hasBanner={form.hasBanner}
            isBannerLocked={form.isBannerLocked}
            canUseGif={canUseAnimatedServerIcon(form.boostLevel)}
            iconTypes={form.iconTypes}
            onPickIcon={form.pickIcon}
            onPickBanner={form.pickBanner}
            onRemoveBanner={form.removeBanner}
          />
          <FieldError message={form.iconError} />
          <FieldError message={form.bannerError} />
          <p className="text-content-subtle text-[11px]">
            {serverIconFormatsHint(form.boostLevel)}
          </p>
        </BoostBenefitField>

        <AnimatedIconField
          level={form.boostLevel}
          boostCount={form.boostCount}
          onPickIcon={form.pickIcon}
        />

        <BannerPresetPicker
          selectedId={form.selectedPresetId}
          level={form.boostLevel}
          boostCount={form.boostCount}
          onSelect={form.choosePreset}
        />

        {vanityField}
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
