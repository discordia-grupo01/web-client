"use client";

import {
  initialPrivateCallState,
  isPrivateCallBusy,
  parseAcceptedPrivateCall,
  parseEndedPrivateCall,
  parsePrivateCall,
  type PrivateCall,
  type PrivateCallPartner,
  privateCallReducer,
  type PrivateCallState,
  type PrivateCallTarget,
  voiceTargetKey,
} from "@discordia/client-shared";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { useVoiceSession } from "@/contexts/VoiceSessionContext";
import {
  acceptPrivateCallRequest,
  finishPrivateCallRequest,
  rejectPrivateCallRequest,
  sendPrivateCallBeacon,
  startPrivateCallRequest,
} from "@/services/voice/client";
import { connectPrivateCalls } from "@/services/voice/socket";

interface PrivateCallValue {
  state: PrivateCallState;
  /** La llamada sigue, pero el dialogo esta cerrado (se ve en la barra de voz). */
  isMinimized: boolean;
  /** Cuando quedaron conectados los dos, para mostrar cuanto lleva la llamada. */
  connectedAt: number | null;
  start: (partner: PrivateCallPartner, conversationId: string) => void;
  accept: () => void;
  /** Quien recibe no atiende. */
  decline: () => void;
  /** Quien llama corta antes de que atiendan. */
  cancel: () => void;
  /** Corta la llamada en curso. */
  hangUp: () => void;
  minimize: () => void;
  restore: () => void;
  dismissNotice: () => void;
}

interface PrivateCallProviderProps {
  currentUserId: string | null;
  /** Nombre y foto de quien llama, para mostrar la llamada entrante. */
  resolvePartner: (userId: string) => Promise<PrivateCallPartner>;
  children: ReactNode;
}

const PrivateCallContext = createContext<PrivateCallValue | null>(null);

function targetOf(
  call: PrivateCall,
  partner: PrivateCallPartner,
): PrivateCallTarget {
  return {
    kind: "private_call",
    callId: call.call_id,
    conversationId: call.conversation_id,
    partnerId: partner.id,
    partnerName: partner.name,
    partnerAvatarUrl: partner.avatarUrl,
  };
}

export function PrivateCallProvider({
  currentUserId,
  resolvePartner,
  children,
}: PrivateCallProviderProps) {
  const voice = useVoiceSession();
  const [state, dispatch] = useReducer(
    privateCallReducer,
    initialPrivateCallState,
  );
  const [isMinimized, setIsMinimized] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const resolvePartnerRef = useRef(resolvePartner);
  useEffect(() => {
    resolvePartnerRef.current = resolvePartner;
  });
  // Se corto mientras `POST /calls` estaba en vuelo: hay que cancelar la que vuelva.
  const isCancelPendingRef = useRef(false);

  const callTarget = useMemo(
    () =>
      state.call && state.partner ? targetOf(state.call, state.partner) : null,
    [state.call, state.partner],
  );
  const callKey = callTarget ? voiceTargetKey(callTarget) : null;
  const voiceKey = voice.state.target
    ? voiceTargetKey(voice.state.target)
    : null;
  const isVoiceInCall = callKey !== null && voiceKey === callKey;

  // --- Eventos del socket `voice_user:<id>` ---
  useEffect(() => {
    if (!currentUserId) return;
    const endFromEvent = (payload: unknown) => {
      const call = parseEndedPrivateCall(payload);
      if (call) dispatch({ type: "ended", call });
    };

    return connectPrivateCalls(currentUserId, {
      incoming: (payload) => {
        const call = parsePrivateCall(payload);
        if (!call) return;
        if (isPrivateCallBusy(stateRef.current)) {
          // Ya estas en otra llamada: para quien llama es como no atender.
          void rejectPrivateCallRequest(call.call_id);
          return;
        }
        void resolvePartnerRef
          .current(call.caller_id)
          .then((partner) => dispatch({ type: "incoming", call, partner }));
      },
      accepted: (payload) => {
        const call = parseAcceptedPrivateCall(payload);
        if (call) dispatch({ type: "accepted", call });
      },
      answered: (payload) => {
        const call = parsePrivateCall(payload);
        if (call)
          dispatch({ type: "answered_elsewhere", callId: call.call_id });
      },
      rejected: endFromEvent,
      missed: endFromEvent,
      ended: endFromEvent,
    });
  }, [currentUserId]);

  const { credentials, phase } = state;
  const { connectWith, leave } = voice;
  useEffect(() => {
    if (phase !== "connecting" || !credentials || !callTarget) return;
    if (!isVoiceInCall) connectWith(callTarget, credentials);
  }, [phase, credentials, callTarget, isVoiceInCall, connectWith]);

  const voiceStatus = voice.state.status;
  useEffect(() => {
    if (phase === "connecting" && isVoiceInCall && voiceStatus === "connected")
      dispatch({ type: "connected" });
  }, [phase, isVoiceInCall, voiceStatus]);

  const wasInCallRef = useRef(false);
  useEffect(() => {
    const call = stateRef.current.call;
    if (isVoiceInCall) {
      wasInCallRef.current = true;
      return;
    }
    if (!wasInCallRef.current) return;
    wasInCallRef.current = false;
    if (call && stateRef.current.phase !== "idle") {
      void finishPrivateCallRequest(call.call_id);
      dispatch({ type: "closed" });
    }
  }, [isVoiceInCall]);

  const lastCallKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (callKey) {
      lastCallKeyRef.current = callKey;
      return;
    }
    const finished = lastCallKeyRef.current;
    lastCallKeyRef.current = null;
    if (finished && voiceKey === finished) {
      wasInCallRef.current = false;
      leave();
    }
  }, [callKey, voiceKey, leave]);

  useEffect(() => {
    if (phase === "idle") setIsMinimized(false);
    if (phase === "in_call") setConnectedAt((at) => at ?? Date.now());
    else setConnectedAt(null);
  }, [phase]);

  useEffect(() => {
    const onPageHide = () => {
      const { call, phase: current } = stateRef.current;
      if (!call) return;
      if (current === "incoming" || current === "outgoing") {
        sendPrivateCallBeacon(call.call_id, "reject");
      } else if (current !== "idle") {
        sendPrivateCallBeacon(call.call_id, "finish");
      }
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, []);

  const start = useCallback(
    (partner: PrivateCallPartner, conversationId: string) => {
      if (isPrivateCallBusy(stateRef.current)) return;
      isCancelPendingRef.current = false;
      dispatch({ type: "start_requested", partner });
      void startPrivateCallRequest(partner.id, conversationId).then(
        (result) => {
          if (!result.ok) {
            if (!isCancelPendingRef.current)
              dispatch({ type: "failed", message: result.message });
            return;
          }
          if (isCancelPendingRef.current) {
            isCancelPendingRef.current = false;
            void rejectPrivateCallRequest(result.call.call_id);
            return;
          }
          dispatch({ type: "started", call: result.call });
        },
      );
    },
    [],
  );

  const accept = useCallback(() => {
    const { call, phase: current } = stateRef.current;
    if (!call || current !== "incoming") return;
    dispatch({ type: "accept_requested" });
    void acceptPrivateCallRequest(call.call_id).then((result) =>
      dispatch(
        result.ok
          ? { type: "accepted", call: result.call }
          : { type: "failed", message: result.message },
      ),
    );
  }, []);

  const decline = useCallback(() => {
    const { call } = stateRef.current;
    if (call) void rejectPrivateCallRequest(call.call_id);
    dispatch({ type: "closed" });
  }, []);

  const cancel = useCallback(() => {
    const { call } = stateRef.current;
    if (call) void rejectPrivateCallRequest(call.call_id);
    else isCancelPendingRef.current = true;
    dispatch({ type: "closed" });
  }, []);

  const hangUp = useCallback(() => {
    const { call } = stateRef.current;
    if (call) void finishPrivateCallRequest(call.call_id);
    wasInCallRef.current = false;
    dispatch({ type: "closed" });
  }, []);

  const minimize = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);
  const dismissNotice = useCallback(
    () => dispatch({ type: "dismiss_notice" }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      isMinimized,
      connectedAt,
      start,
      accept,
      decline,
      cancel,
      hangUp,
      minimize,
      restore,
      dismissNotice,
    }),
    [
      state,
      isMinimized,
      connectedAt,
      start,
      accept,
      decline,
      cancel,
      hangUp,
      minimize,
      restore,
      dismissNotice,
    ],
  );

  return (
    <PrivateCallContext.Provider value={value}>
      {children}
    </PrivateCallContext.Provider>
  );
}

export function useOptionalPrivateCall(): PrivateCallValue | null {
  return useContext(PrivateCallContext);
}
