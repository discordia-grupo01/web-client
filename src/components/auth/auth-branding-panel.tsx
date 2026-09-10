import { Zap } from "lucide-react";

import { APP_NAME } from "@/lib/constants";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#e8a800,#b37d00)",
  "linear-gradient(135deg,#245C6B,#1C293B)",
  "linear-gradient(135deg,#38A169,#1e5c3a)",
  "linear-gradient(135deg,#6b95bd,#2d5a7a)",
];

/**
 * Panel izquierdo del login (solo desktop). Puramente decorativo:
 * branding, claim y prueba social. Sin interactividad.
 */
export function AuthBrandingPanel() {
  return (
    <div
      className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 lg:flex"
      style={{
        background:
          "linear-gradient(160deg, #0f1922 0%, #162535 40%, #1C293B 100%)",
      }}
    >
      {/* Glow orbs */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute -top-20 -left-20 size-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(36,92,107,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute right-0 -bottom-24 size-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(107,149,189,0.25) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Logo */}
      <div className="relative flex items-center gap-3">
        <div
          className="flex size-12 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #245C6B, #1C293B)",
            boxShadow: "0 8px 24px rgba(36,92,107,0.5)",
          }}
        >
          <Zap size={22} className="text-white" fill="currentColor" />
        </div>
        <span className="font-display text-2xl font-bold text-white">
          {APP_NAME}
        </span>
      </div>

      {/* Claim */}
      <div className="relative max-w-sm">
        <h1 className="font-display mb-3 text-3xl leading-tight font-bold text-white">
          Tu comunidad,
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #A8C6DF, #245C6B)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            sin limites.
          </span>
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "rgba(168,198,223,0.6)" }}
        >
          Chat de texto, voz y video para comunidades de todos los tamanos.
          Gratis para siempre.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex -space-x-2">
            {AVATAR_GRADIENTS.map((gradient) => (
              <div
                key={gradient}
                className="size-7 rounded-full border-2"
                style={{ background: gradient, borderColor: "#0f1922" }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: "rgba(168,198,223,0.5)" }}>
            <span className="font-display font-bold text-white">+2.4M</span>{" "}
            usuarios activos hoy
          </p>
        </div>
      </div>
    </div>
  );
}
