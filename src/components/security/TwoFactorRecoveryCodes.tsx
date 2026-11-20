"use client";

import { APP_NAME } from "@discordia/client-shared";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { SettingsFormFooter } from "@/components/ui/settings/SettingsFormFooter";
import { SettingsStep } from "@/components/ui/settings/SettingsStep";

import { SECURITY_TITLE } from "./securityCopy";

interface TwoFactorRecoveryCodesProps {
  codes: string[];
  onDone: () => void;
}

export function TwoFactorRecoveryCodes({
  codes,
  onDone,
}: TwoFactorRecoveryCodesProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setSaved(true);
    } catch {
      // Sin permiso de portapapeles (o sin HTTPS) queda la descarga, que no
      // depende de ningún permiso.
    }
  }

  function downloadCodes() {
    const content = `${APP_NAME} - códigos de recuperación\n\nCada código sirve una sola vez.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    );

    const link = document.createElement("a");
    link.href = url;
    link.download = "discordia-codigos-de-recuperacion.txt";
    link.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <SettingsStep
      parent={SECURITY_TITLE}
      title="Guardá tus códigos de recuperación"
      description="Cada código sirve una sola vez. Esta es la única vez que mostraremos esta lista."
      onBack={onDone}
      footer={
        <SettingsFormFooter>
          <Button
            type="button"
            variant={saved ? "primary" : "secondary"}
            onClick={() => (saved ? onDone() : setSaved(true))}
            className="w-auto px-4 py-2"
          >
            {saved ? "Listo, cerrar" : "Ya los guardé"}
          </Button>
        </SettingsFormFooter>
      }
    >
      <div className="space-y-5">
        <div className="bg-surface-raised border-line grid grid-cols-2 gap-2 rounded-2xl border p-4 sm:grid-cols-5">
          {codes.map((code, index) => (
            <div
              key={code}
              className="bg-surface-input text-content rounded-lg px-2 py-2 text-center font-mono text-xs"
            >
              <span className="text-content-subtle mr-1">{index + 1}.</span>
              {code}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={copyCodes}
            className="w-auto px-4 py-2"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? "Copiados" : "Copiar códigos"}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={downloadCodes}
            className="w-auto px-4 py-2"
          >
            <Download size={16} />
            <span>Descargar .txt</span>
          </Button>
        </div>
      </div>
    </SettingsStep>
  );
}
