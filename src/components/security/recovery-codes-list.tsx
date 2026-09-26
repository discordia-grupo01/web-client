"use client";

import {
  TWO_FACTOR_RECOVERY_CODES_WARNING,
  APP_NAME,
} from "@discordia/client-shared";

import { AlertTriangle, Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function RecoveryCodesList({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
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
  }

  return (
    <div className="space-y-4">
      <div className="border-highlight/30 bg-highlight/10 flex items-start gap-3 rounded-xl border px-4 py-3">
        <AlertTriangle
          size={16}
          className="text-highlight mt-0.5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-content-muted text-xs leading-relaxed">
          {TWO_FACTOR_RECOVERY_CODES_WARNING}
        </p>
      </div>

      <ul className="bg-surface-input border-line grid grid-cols-2 gap-2 rounded-xl border p-4">
        {codes.map((code) => (
          <li
            key={code}
            className="text-content text-center font-mono text-sm tracking-wider tabular-nums"
          >
            {code}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={copyCodes}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "Copiados" : "Copiar"}</span>
        </Button>
        <Button type="button" variant="secondary" onClick={downloadCodes}>
          <Download size={16} />
          <span>Descargar</span>
        </Button>
      </div>
    </div>
  );
}
