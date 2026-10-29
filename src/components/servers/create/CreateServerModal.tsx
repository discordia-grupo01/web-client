"use client";

import { type ServerSummary } from "@discordia/client-shared";
import { Link2 } from "lucide-react";
import { type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { FormAlert } from "@/components/ui/FormAlert";
import { ModalShell } from "@/components/ui/ModalShell";

import { useCreateServerForm } from "@/components/servers/hooks/useCreateServerForm";
import { ServerNameField } from "../ServerNameField";
import { CreateServerSuccess } from "./CreateServerSuccess";
import { ServerIconUploader } from "./ServerIconUploader";

const TITLE_ID = "create-server-title";
const NAME_INPUT_ID = "server-name";

interface CreateServerModalProps {
  onClose: () => void;
  onCreated: (server: ServerSummary) => void;
  /** Si se pasa, muestra al pie la opcion de unirse con un enlace. */
  onJoinClick?: () => void;
}

export function CreateServerModal({
  onClose,
  onCreated,
  onJoinClick,
}: CreateServerModalProps) {
  const form = useCreateServerForm();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  return (
    <ModalShell onClose={onClose} labelledBy={TITLE_ID}>
      <div className="flex-1 overflow-y-auto">
        {form.created ? (
          <CreateServerSuccess
            server={form.created}
            iconPreviewUrl={form.icon?.previewUrl ?? null}
            onContinue={() => form.created && onCreated(form.created)}
          />
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="px-7 pt-8 pb-2 text-center">
              <h2
                id={TITLE_ID}
                className="font-display text-content mb-1 text-xl font-bold"
              >
                Crear un servidor
              </h2>
              <p className="text-content-muted text-sm leading-relaxed">
                Personalizá tu servidor con un nombre e ícono.
                <br />
                Siempre podés cambiarlo después.
              </p>
            </div>

            <div className="space-y-6 px-7 py-6">
              <FormAlert message={form.globalError} />

              <ServerIconUploader
                serverName={form.name}
                icon={form.icon}
                error={form.iconError}
                onPick={form.pickIcon}
                onRemove={form.removeIcon}
              />

              <ServerNameField
                inputId={NAME_INPUT_ID}
                value={form.name}
                error={form.nameError}
                onChange={form.changeName}
              />
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
                disabled={!form.canSubmit}
                isLoading={form.isSubmitting}
                className="w-auto"
              >
                Crear servidor
              </Button>
            </div>

            {onJoinClick ? (
              <div className="bg-surface-sunken border-line flex flex-col items-center gap-2 border-t px-7 py-5 text-center">
                <p className="font-display text-content text-sm font-semibold">
                  ¿Ya tenés una invitación?
                </p>
                <button
                  type="button"
                  onClick={onJoinClick}
                  className="bg-surface-input border-line text-content-muted hover:text-content flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all hover:brightness-110"
                >
                  <Link2 size={15} />
                  Unirme con un enlace
                </button>
              </div>
            ) : null}
          </form>
        )}
      </div>
    </ModalShell>
  );
}
