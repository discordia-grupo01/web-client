"use client";

import {
  MAX_NAME,
  MIN_SERVER_NAME,
  PRESET_BANNER_FAILED,
  type PresetBanner,
  type ServerSummary,
  validateServerBanner,
  validateServerIcon,
  validateServerName,
} from "@discordia/client-shared";
import { useState } from "react";

import { presetBannerFile, presetBannerGradientCss } from "@/lib/preset-banner";
import { updateServerRequest } from "@/services/servers/client";
import { serverBannerSrc, serverIconSrc } from "@/services/servers/image-urls";

/**
 * Los cuatro estados en los que puede quedar el banner. Es una union y no
 * tres piezas de estado sueltas (`file` + `presetId` + `removed`) porque son
 * mutuamente excluyentes: elegir un fondo fijo tiene que descartar el archivo
 * subido y viceversa, y con booleanos sueltos eso se olvida.
 */
type BannerChoice =
  | { kind: "current" }
  | { kind: "upload"; file: File; previewUrl: string }
  | { kind: "preset"; preset: PresetBanner }
  | { kind: "removed" };

interface UseServerSettingsFormArgs {
  server: ServerSummary;
  onUpdated: (server: ServerSummary) => void;
}

function readPreview(file: File, onLoad: (dataUrl: string) => void): void {
  const reader = new FileReader();
  reader.onload = (event) => onLoad(event.target?.result as string);
  reader.readAsDataURL(file);
}

/**
 * Estado y envio del formulario de configuracion del servidor.
 *
 * Vive aparte del modal para que los componentes sean solo markup: el modal
 * arma la pantalla, `ServerIdentityEditor` y `BannerPresetPicker` reciben
 * props y no saben que existe un backend.
 *
 * El modal se monta recien cuando se abre, asi que no hace falta resetear
 * nada: cerrar y volver a abrir arranca de cero.
 */
export function useServerSettingsForm({
  server,
  onUpdated,
}: UseServerSettingsFormArgs) {
  const [name, setName] = useState(server.name);
  const [icon, setIcon] = useState<{ file: File; previewUrl: string } | null>(
    null,
  );
  const [banner, setBanner] = useState<BannerChoice>({ kind: "current" });
  const [nameError, setNameError] = useState("");
  const [iconError, setIconError] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedName = name.trim();
  const nameChanged = trimmedName !== server.name;
  // Pedir que borren un banner que no existe no es un cambio.
  const bannerChanged =
    banner.kind === "upload" ||
    banner.kind === "preset" ||
    (banner.kind === "removed" && server.banner_url !== null);
  const hasChanges = nameChanged || icon !== null || bannerChanged;

  const canSubmit =
    trimmedName.length >= MIN_SERVER_NAME &&
    name.length <= MAX_NAME &&
    hasChanges &&
    !isSubmitting;

  const iconPreviewSrc = icon?.previewUrl ?? serverIconSrc(server);
  const bannerPreviewSrc =
    banner.kind === "upload"
      ? banner.previewUrl
      : banner.kind === "current"
        ? serverBannerSrc(server)
        : null;
  const bannerPreviewGradient =
    banner.kind === "preset" ? presetBannerGradientCss(banner.preset) : null;

  function changeName(value: string) {
    setName(value);
    setNameError("");
    setGlobalError("");
  }

  function pickIcon(file: File) {
    setIconError("");
    setGlobalError("");
    const error = validateServerIcon({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (error) {
      setIconError(error);
      return;
    }
    readPreview(file, (previewUrl) => setIcon({ file, previewUrl }));
  }

  function pickBanner(file: File) {
    setBannerError("");
    setGlobalError("");
    const error = validateServerBanner({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (error) {
      setBannerError(error);
      return;
    }
    readPreview(file, (previewUrl) =>
      setBanner({ kind: "upload", file, previewUrl }),
    );
  }

  function choosePreset(preset: PresetBanner) {
    setBannerError("");
    setGlobalError("");
    setBanner({ kind: "preset", preset });
  }

  function removeBanner() {
    setBannerError("");
    setGlobalError("");
    setBanner({ kind: "removed" });
  }

  /**
   * Solo viaja lo que cambio: el backend pisa unicamente los campos presentes
   * en el multipart, asi que mandar el nombre no toca el icono ni el banner.
   */
  async function buildFormData(): Promise<FormData> {
    const formData = new FormData();
    if (nameChanged) formData.set("name", trimmedName);
    if (icon) formData.set("icon", icon.file);

    if (banner.kind === "upload") formData.set("banner", banner.file);
    if (banner.kind === "preset") {
      formData.set("banner", await presetBannerFile(banner.preset));
    }
    if (banner.kind === "removed") formData.set("remove_banner", "true");

    return formData;
  }

  async function submit() {
    setNameError("");
    setGlobalError("");

    const validationError = validateServerName(trimmedName);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setIsSubmitting(true);

    let formData: FormData;
    try {
      formData = await buildFormData();
    } catch {
      // Materializar el fondo fijo fallo: no llegamos ni a pegarle al backend.
      setIsSubmitting(false);
      setBannerError(PRESET_BANNER_FAILED);
      return;
    }

    const result = await updateServerRequest(server.id, formData);
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.fieldErrors?.name) setNameError(result.fieldErrors.name);
      if (result.fieldErrors?.icon) setIconError(result.fieldErrors.icon);
      if (result.fieldErrors?.banner) setBannerError(result.fieldErrors.banner);
      if (!result.fieldErrors) setGlobalError(result.message);
      return;
    }

    onUpdated(result.server);
  }

  return {
    name,
    changeName,
    nameError,
    iconError,
    bannerError,
    globalError,
    isSubmitting,
    canSubmit,
    iconPreviewSrc,
    bannerPreviewSrc,
    bannerPreviewGradient,
    hasBanner: bannerPreviewSrc !== null || bannerPreviewGradient !== null,
    selectedPresetId: banner.kind === "preset" ? banner.preset.id : null,
    pickIcon,
    pickBanner,
    choosePreset,
    removeBanner,
    submit,
  };
}
