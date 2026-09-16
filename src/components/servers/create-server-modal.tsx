"use client";

import {
  AlertCircle,
  Camera,
  Check,
  Hash,
  Pencil,
  Volume2,
  X,
} from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/button";
import { createServerRequest } from "@/services/servers/client";
import type { ServerSummary } from "@/types/server.types";
import { cn } from "@/lib/cn";

const MAX_NAME = 100;
const MAX_FILE_MB = 20;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

interface CreateServerModalProps {
  onClose: () => void;
  onCreated: (server: ServerSummary) => void;
}

function ServerIconPreview({
  name,
  size = 96,
}: {
  name: string;
  size?: number;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || null;

  return (
    <div
      className="from-accent border-line-strong flex shrink-0 items-center justify-center rounded-full border-2 border-dashed bg-gradient-to-br to-[#1a4050]"
      style={{ width: size, height: size }}
    >
      {initial ? (
        <span
          className="font-display font-bold text-white"
          style={{ fontSize: size * 0.42 }}
        >
          {initial}
        </span>
      ) : (
        <Camera size={size * 0.32} className="text-white/50" />
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="text-danger mt-1.5 flex items-center gap-1.5 text-xs">
      <AlertCircle size={13} />
      <span>{message}</span>
    </div>
  );
}

export function CreateServerModal({
  onClose,
  onCreated,
}: CreateServerModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [created, setCreated] = useState<ServerSummary | null>(null);
  const [name, setName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const [iconError, setIconError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nameLength = name.length;
  const nameTooLong = nameLength > MAX_NAME;
  const nameNearLimit = nameLength >= MAX_NAME - 10;
  const canSubmit = name.trim().length >= 2 && !nameTooLong && !isSubmitting;

  const processFile = useCallback((file: File) => {
    setIconError("");
    if (!ALLOWED_TYPES.includes(file.type)) {
      setIconError("El archivo debe ser PNG, JPG o WEBP.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setIconError(`El archivo no puede pesar más de ${MAX_FILE_MB} MB.`);
      return;
    }
    setIconFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setIconPreview(event.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function removeIcon() {
    setIconFile(null);
    setIconPreview(null);
    setIconError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNameError("");
    setGlobalError("");

    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Ingresá un nombre para el servidor.");
      return;
    }
    if (trimmed.length < 2 || trimmed.length > MAX_NAME) {
      setNameError("El nombre debe tener entre 2 y 100 caracteres.");
      return;
    }

    const formData = new FormData();
    formData.set("name", trimmed);
    if (iconFile) formData.set("icon", iconFile);

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
    setStep("success");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="border-line-strong relative flex w-full flex-col overflow-hidden rounded-[20px] border shadow-[0_32px_80px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: 460,
          maxHeight: "95dvh",
          background: "var(--bg-modal)",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="bg-surface-input text-content-subtle border-line absolute top-4 right-4 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full border transition-transform hover:scale-110"
        >
          <X size={14} />
        </button>

        <div className="flex-1 overflow-y-auto">
          {step === "success" && created ? (
            <div className="flex flex-col items-center gap-6 px-6 py-8 text-center">
              <div className="bg-surface border-line-strong w-full overflow-hidden rounded-2xl border">
                <div className="bg-surface-sunken border-line flex items-center gap-3 border-b px-4 py-3">
                  {iconPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={iconPreview}
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <ServerIconPreview name={created.name} size={36} />
                  )}
                  <span className="font-display text-content truncate text-sm font-bold">
                    {created.name}
                  </span>
                </div>
                <div className="space-y-0.5 px-3 py-3">
                  {created.channels.map((channel) => (
                    <div
                      key={channel.id}
                      className="bg-surface-input flex items-center gap-2 rounded-lg px-2 py-1.5"
                    >
                      {channel.kind === "text" ? (
                        <Hash size={15} className="text-content-subtle" />
                      ) : (
                        <Volume2 size={15} className="text-content-subtle" />
                      )}
                      <span className="text-content-muted text-sm">
                        {channel.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="bg-success/15 text-success flex size-12 items-center justify-center rounded-2xl">
                  <Check size={26} />
                </div>
                <p className="font-display text-content text-base font-bold">
                  ¡Servidor creado!
                </p>
                <p className="text-content-muted max-w-[260px] text-sm leading-relaxed">
                  <strong className="text-content">{created.name}</strong> ya
                  está listo. Encontrás tus canales en la barra lateral.
                </p>
              </div>

              <Button type="button" onClick={() => onCreated(created)}>
                Ir al servidor
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="px-7 pt-8 pb-2 text-center">
                <h2 className="font-display text-content mb-1 text-xl font-bold">
                  Crear un servidor
                </h2>
                <p className="text-content-muted text-sm leading-relaxed">
                  Personalizá tu servidor con un nombre e ícono.
                  <br />
                  Siempre podés cambiarlo después.
                </p>
              </div>

              <div className="space-y-6 px-7 py-6">
                {globalError ? (
                  <div className="border-danger/30 bg-danger/10 text-danger flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
                    <AlertCircle size={16} />
                    <span>{globalError}</span>
                  </div>
                ) : null}

                <div className="flex flex-col items-center gap-3">
                  <div className="group relative">
                    <div
                      className="relative cursor-pointer rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                    >
                      {iconPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={iconPreview}
                          alt="Ícono del servidor"
                          className={cn(
                            "size-24 rounded-full border-2 object-cover transition-colors",
                            isDragging
                              ? "border-accent-strong"
                              : "border-line-strong",
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "rounded-full",
                            isDragging && "ring-accent-strong ring-2",
                          )}
                        >
                          <ServerIconPreview name={name} />
                        </div>
                      )}

                      <div
                        className={cn(
                          "absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100",
                          isDragging && "opacity-100",
                        )}
                      >
                        <Camera size={20} className="text-white" />
                        <span className="text-[10px] font-semibold text-white">
                          {isDragging
                            ? "Soltar"
                            : iconPreview
                              ? "Cambiar"
                              : "Subir"}
                        </span>
                      </div>
                    </div>

                    {iconPreview ? (
                      <button
                        type="button"
                        onClick={removeIcon}
                        aria-label="Quitar imagen"
                        className="bg-danger absolute -top-1 -right-1 flex size-6 cursor-pointer items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
                        style={{ borderColor: "var(--bg-modal)" }}
                      >
                        <X size={10} className="text-white" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-surface-input border-line text-content-muted flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-110"
                    >
                      <Pencil size={11} />
                      {iconFile ? "Cambiar imagen" : "Subir imagen"}
                    </button>
                    {iconFile ? (
                      <button
                        type="button"
                        onClick={removeIcon}
                        className="text-danger cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity hover:opacity-80"
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>

                  {iconFile && !iconError ? (
                    <p className="text-content-subtle text-xs">
                      {iconFile.name} ·{" "}
                      {(iconFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  ) : null}

                  <FieldError message={iconError} />

                  <p className="text-content-subtle text-center text-[11px]">
                    PNG, JPG o WEBP · Máx. 20 MB
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="server-name"
                      className="text-content-subtle text-xs font-bold tracking-wider uppercase"
                    >
                      Nombre del servidor <span className="text-danger">*</span>
                    </label>
                    <span
                      className={cn(
                        "font-mono text-xs tabular-nums",
                        nameTooLong
                          ? "text-danger"
                          : nameNearLimit
                            ? "text-[#F0B232]"
                            : "text-content-subtle",
                      )}
                    >
                      {nameLength}/{MAX_NAME}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "bg-surface-input flex items-center rounded-xl border px-4 py-3 transition-colors",
                      nameError ? "border-danger" : "border-line",
                    )}
                  >
                    <input
                      id="server-name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setNameError("");
                        setGlobalError("");
                      }}
                      placeholder="Mi servidor épico"
                      maxLength={110}
                      autoFocus
                      className="text-content min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
                    />
                  </div>

                  <FieldError message={nameError} />
                </div>
              </div>

              <div className="border-line flex items-center justify-end gap-3 border-t px-7 py-5">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  isLoading={isSubmitting}
                  className="w-auto"
                >
                  Crear servidor
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileInput}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
