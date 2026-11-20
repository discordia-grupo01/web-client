"use client";

import {
  canUseAnimatedServerIcon,
  SERVER_BANNER_BENEFIT_COPY,
  serverIconFormatsHint,
} from "@discordia/client-shared";
import { type FormEvent, type ReactNode } from "react";

import { BoostBenefitField } from "@/components/boosts/benefits/BoostBenefitField";
import { BoostProgressStrip } from "@/components/boosts/status/BoostProgressStrip";
import { FieldError } from "@/components/ui/FieldError";
import { FormAlert } from "@/components/ui/FormAlert";
import { SaveBar } from "@/components/ui/settings/SaveBar";
import { SettingsSection } from "@/components/ui/settings/SettingsSection";

import { type ServerSettingsForm } from "@/components/servers/hooks/useServerSettingsForm";
import { ServerNameField } from "../ServerNameField";
import { AnimatedIconField } from "./AnimatedIconField";
import { BannerPresetPicker } from "./BannerPresetPicker";
import { ServerIdentityEditor } from "./ServerIdentityEditor";

const NAME_INPUT_ID = "server-settings-name";

interface ServerProfileFormProps {
  form: ServerSettingsForm;
  serverName: string;
  onBoost?: () => void;
  /** "Ver qué suma cada nivel": Boosts del servidor en la pestaña Beneficios. */
  onShowBenefits?: () => void;
  /** URL de invitación personalizada: se guarda aparte, con su propio botón. */
  vanityField?: ReactNode;
}

export function ServerProfileForm({
  form,
  serverName,
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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <SettingsSection
        description="Actualizá la identidad visual de tu comunidad."
        footer={
          form.hasChanges ? (
            <SaveBar
              isSaving={form.isSubmitting}
              canSave={form.canSubmit}
              onDiscard={form.reset}
            />
          ) : null
        }
      >
        <div className="space-y-6">
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
      </SettingsSection>
    </form>
  );
}
