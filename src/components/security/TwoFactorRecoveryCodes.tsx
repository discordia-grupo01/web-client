"use client";

import { APP_NAME } from "@discordia/client-shared";

import { Check, CheckCircle, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

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
    <div className="space-y-5">
      <div className="text-center">
        <div className="bg-success/15 text-success mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl">
          <CheckCircle size={28} />
        </div>
        <h3 className="text-content font-display text-xl font-bold">
          Guardá tus códigos de recuperación
        </h3>
        <p className="text-content-muted mx-auto mt-1 max-w-md text-sm">
          Cada código sirve una sola vez. Esta es la única vez que mostraremos
          esta lista.
        </p>
      </div>

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

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={copyCodes}
          className="flex-1"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "Copiados" : "Copiar códigos"}</span>
        </Button>
        <Button type="button" onClick={downloadCodes} className="flex-1">
          <Download size={16} />
          <span>Descargar .txt</span>
        </Button>
      </div>

      <button
        type="button"
        onClick={() => (saved ? onDone() : setSaved(true))}
        className={
          saved
            ? "text-info w-full cursor-pointer py-2 text-center text-sm font-semibold"
            : "text-content-subtle w-full cursor-pointer py-2 text-center text-sm font-semibold"
        }
      >
        {saved ? "Listo, cerrar" : "Ya los guardé"}
      </button>
    </div>
  );
}
