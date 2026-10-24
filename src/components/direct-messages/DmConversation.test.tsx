import {
  CHAT_OFFLINE_HINT,
  CHAT_OFFLINE_TITLE,
  RETRY_LABEL,
  SELECT_CONVERSATION_NOTICE,
  type MessageAuthor,
} from "@discordia/client-shared";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DmConversation } from "./DmConversation";

vi.mock("@/components/layout/MobileNavButton", () => ({
  MobileNavButton: () => null,
}));

const me: MessageAuthor = {
  id: "me",
  name: "Ana",
  avatarUrl: null,
  roleName: null,
  roleColor: null,
};

function renderEmpty(isOffline: boolean, onRetryLoad = vi.fn()) {
  return render(
    <DmConversation
      currentAuthor={me}
      activeSummary={null}
      onSend={vi.fn()}
      isConnected={!isOffline}
      isOffline={isOffline}
      onRetryLoad={onRetryLoad}
      onOpenPartnerProfile={vi.fn()}
      onOpenProfile={vi.fn()}
    />,
  );
}

describe("DmConversation sin conversacion elegida", () => {
  it("pide elegir una conversacion cuando hay conexion", () => {
    renderEmpty(false);

    expect(screen.getByText(SELECT_CONVERSATION_NOTICE)).toBeInTheDocument();
    expect(screen.queryByText(CHAT_OFFLINE_TITLE)).toBeNull();
  });

  it("sin conexion avisa que no hay conexion, no que elija una conversacion", () => {
    renderEmpty(true);

    expect(screen.getByText(CHAT_OFFLINE_TITLE)).toBeInTheDocument();
    expect(screen.getByText(CHAT_OFFLINE_HINT)).toBeInTheDocument();
    expect(screen.queryByText(SELECT_CONVERSATION_NOTICE)).toBeNull();
  });

  it("el panel sin conexion tiene Reintentar, que vuelve a pedir la lista", () => {
    const onRetryLoad = vi.fn();
    renderEmpty(true, onRetryLoad);

    fireEvent.click(screen.getByRole("button", { name: RETRY_LABEL }));

    expect(onRetryLoad).toHaveBeenCalledTimes(1);
  });
});
