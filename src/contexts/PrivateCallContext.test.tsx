import type {
  PrivateCallPartner,
  VoiceSessionState,
} from "@discordia/client-shared";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrivateCallHandlers } from "@/services/voice/socket";

import {
  PrivateCallProvider,
  useOptionalPrivateCall,
} from "./PrivateCallContext";

const socket = vi.hoisted(() => ({
  handlers: null as PrivateCallHandlers | null,
}));
vi.mock("@/services/voice/socket", () => ({
  connectPrivateCalls: (_userId: string, handlers: PrivateCallHandlers) => {
    socket.handlers = handlers;
    return () => undefined;
  },
}));

const requests = vi.hoisted(() => ({
  startPrivateCallRequest: vi.fn(),
  acceptPrivateCallRequest: vi.fn(),
  rejectPrivateCallRequest: vi.fn(),
  finishPrivateCallRequest: vi.fn(),
  sendPrivateCallBeacon: vi.fn(),
}));
vi.mock("@/services/voice/client", () => requests);

const voice = vi.hoisted(() => ({
  state: {
    target: null,
    status: "idle",
  } as Pick<VoiceSessionState, "target" | "status">,
  connectWith: vi.fn(),
  leave: vi.fn(),
}));
vi.mock("@/contexts/VoiceSessionContext", () => ({
  useVoiceSession: () => voice,
}));

const ana: PrivateCallPartner = { id: "ana", name: "Ana", avatarUrl: null };
const beto: PrivateCallPartner = { id: "beto", name: "Beto", avatarUrl: null };

const ringing = {
  call_id: "call-1",
  conversation_id: "conv-1",
  caller_id: "ana",
  recipient_id: "beto",
  room_name: "private-call:call-1",
  status: "ringing",
};
const accepted = {
  ...ringing,
  status: "active",
  token: "jwt",
  url: "wss://livekit",
};

let actions: ReturnType<typeof useOptionalPrivateCall> = null;

function Probe() {
  actions = useOptionalPrivateCall();
  return (
    <p data-testid="call">
      {actions?.state.phase}|{actions?.state.notice ?? ""}
    </p>
  );
}

function renderProvider(currentUserId = "beto") {
  const ui = () => (
    <PrivateCallProvider
      currentUserId={currentUserId}
      resolvePartner={async (id) => (id === "ana" ? ana : beto)}
    >
      <Probe />
    </PrivateCallProvider>
  );
  const view = render(ui());
  return { rerender: () => view.rerender(ui()) };
}

function shown() {
  return screen.getByTestId("call").textContent;
}

beforeEach(() => {
  vi.clearAllMocks();
  socket.handlers = null;
  voice.state = { target: null, status: "idle" };
});

describe("llamada entrante", () => {
  it("suena y al atender se conecta a la sala con sus credenciales", async () => {
    requests.acceptPrivateCallRequest.mockResolvedValue({
      ok: true,
      call: accepted,
    });
    renderProvider();

    act(() => socket.handlers?.incoming(ringing));
    await waitFor(() => expect(shown()).toBe("incoming|"));

    act(() => actions?.accept());
    await waitFor(() =>
      expect(voice.connectWith).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: "private_call",
          callId: "call-1",
          partnerName: "Ana",
        }),
        { token: "jwt", url: "wss://livekit" },
      ),
    );
    expect(requests.acceptPrivateCallRequest).toHaveBeenCalledWith("call-1");
  });

  it("deja de sonar si se atendio en otra pestaña", async () => {
    renderProvider();
    act(() => socket.handlers?.incoming(ringing));
    await waitFor(() => expect(shown()).toBe("incoming|"));

    act(() => socket.handlers?.answered({ ...ringing, status: "active" }));

    expect(shown()).toBe("idle|");
  });

  it("si ya estas en otra llamada, la rechaza", async () => {
    requests.startPrivateCallRequest.mockReturnValue(new Promise(() => {}));
    renderProvider();
    act(() => actions?.start(ana, "conv-2"));

    act(() => socket.handlers?.incoming({ ...ringing, call_id: "call-9" }));

    expect(requests.rejectPrivateCallRequest).toHaveBeenCalledWith("call-9");
    expect(shown()).toBe("outgoing|");
  });

  it("avisa la llamada perdida cuando quien llama cancela", async () => {
    renderProvider();
    act(() => socket.handlers?.incoming(ringing));
    await waitFor(() => expect(shown()).toBe("incoming|"));

    act(() =>
      socket.handlers?.rejected({
        ...ringing,
        status: "rejected",
        reason: "cancelled",
        ended_by: "ana",
      }),
    );

    expect(shown()).toBe("idle|Llamada perdida de Ana.");
  });
});

describe("llamada saliente", () => {
  it("avisa a quien llama que lo rechazaron", async () => {
    requests.startPrivateCallRequest.mockResolvedValue({
      ok: true,
      call: ringing,
    });
    renderProvider("ana");

    act(() => actions?.start(beto, "conv-1"));
    await waitFor(() =>
      expect(requests.startPrivateCallRequest).toHaveBeenCalledWith(
        "beto",
        "conv-1",
      ),
    );
    await act(async () => {});

    act(() =>
      socket.handlers?.rejected({
        ...ringing,
        status: "rejected",
        reason: "declined",
        ended_by: "beto",
      }),
    );

    expect(shown()).toBe("idle|Beto rechazó la llamada.");
  });

  it("si cancela antes de que responda el back, cancela la llamada que vuelve", async () => {
    let respond: (value: unknown) => void = () => undefined;
    requests.startPrivateCallRequest.mockReturnValue(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );
    renderProvider("ana");

    act(() => actions?.start(beto, "conv-1"));
    act(() => actions?.cancel());
    await act(async () => respond({ ok: true, call: ringing }));

    expect(requests.rejectPrivateCallRequest).toHaveBeenCalledWith("call-1");
    expect(shown()).toBe("idle|");
  });

  it("muestra el error si no se pudo llamar", async () => {
    requests.startPrivateCallRequest.mockResolvedValue({
      ok: false,
      message: "No podés llamar a este usuario.",
    });
    renderProvider("ana");

    act(() => actions?.start(beto, "conv-1"));

    await waitFor(() =>
      expect(shown()).toBe("idle|No podés llamar a este usuario."),
    );
  });
});

describe("en llamada", () => {
  async function inCall() {
    requests.acceptPrivateCallRequest.mockResolvedValue({
      ok: true,
      call: accepted,
    });
    const view = renderProvider();
    act(() => socket.handlers?.incoming(ringing));
    await waitFor(() => expect(shown()).toBe("incoming|"));
    act(() => actions?.accept());
    await waitFor(() => expect(voice.connectWith).toHaveBeenCalled());

    voice.state = {
      target: voice.connectWith.mock.calls[0][0],
      status: "connected",
    };
    view.rerender();
    await waitFor(() => expect(shown()).toBe("in_call|"));
    return view;
  }

  it("cortar avisa al back y sale de la sala", async () => {
    await inCall();

    act(() => actions?.hangUp());

    expect(requests.finishPrivateCallRequest).toHaveBeenCalledWith("call-1");
    expect(voice.leave).toHaveBeenCalled();
    expect(shown()).toBe("idle|");
  });

  it("si el otro corta, sale de la sala y lo avisa", async () => {
    await inCall();

    act(() =>
      socket.handlers?.ended({
        ...accepted,
        status: "ended",
        reason: "hangup",
        ended_by: "ana",
      }),
    );

    expect(voice.leave).toHaveBeenCalled();
    expect(shown()).toBe("idle|Ana finalizó la llamada.");
    expect(requests.finishPrivateCallRequest).not.toHaveBeenCalled();
  });

  it("si se pierde la sala de voz, termina la llamada para los dos", async () => {
    const view = await inCall();

    voice.state = { target: null, status: "idle" };
    view.rerender();

    await waitFor(() =>
      expect(requests.finishPrivateCallRequest).toHaveBeenCalledWith("call-1"),
    );
    expect(shown()).toBe("idle|");
  });
});
