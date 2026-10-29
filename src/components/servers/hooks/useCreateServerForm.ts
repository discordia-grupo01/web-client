"use client";

import {
  MAX_NAME,
  MIN_SERVER_NAME,
  type ServerSummary,
  validateServerIcon,
  validateServerName,
} from "@discordia/client-shared";
import { useState } from "react";

import { createServerRequest } from "@/services/servers/client";
import { readFileAsDataUrl } from "@/utils/readFileAsDataUrl";

export interface PickedServerIcon {
  file: File;
  previewUrl: string;
}

export function useCreateServerForm() {
  const [created, setCreated] = useState<ServerSummary | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<PickedServerIcon | null>(null);
  const [nameError, setNameError] = useState("");
  const [iconError, setIconError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    name.trim().length >= MIN_SERVER_NAME &&
    name.length <= MAX_NAME &&
    !isSubmitting;

  function changeName(value: string) {
    setName(value);
    setNameError("");
    setGlobalError("");
  }

  function pickIcon(file: File) {
    setIconError("");
    const error = validateServerIcon({
      mimeType: file.type,
      sizeBytes: file.size,
    });
    if (error) {
      setIconError(error);
      return;
    }
    void readFileAsDataUrl(file).then((previewUrl) =>
      setIcon({ file, previewUrl }),
    );
  }

  function removeIcon() {
    setIcon(null);
    setIconError("");
  }

  async function submit() {
    setNameError("");
    setGlobalError("");

    const trimmed = name.trim();
    const validationError = validateServerName(trimmed);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    const formData = new FormData();
    formData.set("name", trimmed);
    if (icon) formData.set("icon", icon.file);

    setIsSubmitting(true);
    const result = await createServerRequest(formData);
    setIsSubmitting(false);

    if (!result.ok) {
      if (result.fieldErrors?.name) setNameError(result.fieldErrors.name);
      if (result.fieldErrors?.icon) setIconError(result.fieldErrors.icon);
      if (!result.fieldErrors) setGlobalError(result.message);
      return;
    }

    setCreated(result.server);
  }

  return {
    created,
    name,
    changeName,
    icon,
    pickIcon,
    removeIcon,
    nameError,
    iconError,
    globalError,
    isSubmitting,
    canSubmit,
    submit,
  };
}
