"use client";

import { Hash, Link2, Plus, Users, Volume2, Zap } from "lucide-react";
import type { ReactNode } from "react";

interface ActionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  accent?: boolean;
  onClick: () => void;
}

function ActionCard({
  icon,
  title,
  description,
  cta,
  accent,
  onClick,
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
        accent
          ? "bg-accent/[0.12] border-accent/40 hover:border-accent/70 hover:bg-accent/[0.18]"
          : "bg-surface-input border-line hover:border-line-strong hover:bg-white/[0.03]"
      }`}
    >
      <div
        className={`mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl ${
          accent
            ? "bg-accent/30 text-sky"
            : "text-content-subtle bg-white/[0.06]"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-content mb-0.5 text-sm font-bold">
          {title}
        </p>
        <p className="text-content-muted text-xs leading-relaxed">
          {description}
        </p>
        <p
          className={`font-display mt-2 text-xs font-semibold ${accent ? "text-sky" : "text-info"}`}
        >
          {cta} →
        </p>
      </div>
    </button>
  );
}

const FEATURE_PILLS = [
  { icon: <Hash size={11} />, label: "Canales de texto" },
  { icon: <Volume2 size={11} />, label: "Canales de voz" },
  { icon: <Zap size={11} />, label: "Roles y permisos" },
  { icon: <Users size={11} />, label: "Invitaciones sin límite de usos" },
];

const FLOATING_SERVERS = [
  {
    label: "🎮",
    angle: -40,
    r: 80,
    gradient: "linear-gradient(135deg,#245C6B,#1C293B)",
    delay: "0s",
  },
  {
    label: "🎨",
    angle: 12,
    r: 90,
    gradient: "linear-gradient(135deg,#6b95bd,#2d5a7a)",
    delay: "0.4s",
  },
  {
    label: "🏆",
    angle: 55,
    r: 78,
    gradient: "linear-gradient(135deg,#38A169,#1e5c3a)",
    delay: "0.8s",
  },
];

interface EmptyStateProps {
  userName?: string;
  onCreateClick: () => void;
  onJoinClick: () => void;
}

/** Estado del home cuando el usuario todavía no es miembro de ningún servidor. */
export function EmptyState({
  userName,
  onCreateClick,
  onJoinClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-12">
      <div className="m-auto flex w-full max-w-lg flex-col gap-8">
        {/* Hero illustration */}
        <div className="relative mx-auto mt-6 mb-6 flex h-28 w-28 items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0 scale-[1.7] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(36,92,107,0.32) 0%, transparent 70%)",
              filter: "blur(36px)",
            }}
          />

          {FLOATING_SERVERS.map(({ label, angle, r, gradient, delay }) => {
            const rad = (angle * Math.PI) / 180;
            const x = Math.cos(rad) * r;
            const y = Math.sin(rad) * r;
            return (
              <div
                key={label}
                className="home-empty-float absolute flex size-10 items-center justify-center rounded-2xl text-lg shadow-xl"
                style={{
                  background: gradient,
                  left: `calc(50% + ${x}px - 20px)`,
                  top: `calc(50% + ${y}px - 20px)`,
                  border: "2px solid rgba(168,198,223,0.15)",
                  animationDelay: delay,
                }}
                aria-hidden="true"
              >
                {label}
              </div>
            );
          })}

          <div
            className="relative flex size-28 items-center justify-center rounded-[32px] shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #162535 0%, #1C293B 100%)",
              border: "1px solid rgba(168,198,223,0.18)",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(168,198,223,0.08)",
            }}
          >
            <svg
              width={54}
              height={54}
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect
                x={2}
                y={3}
                width={20}
                height={14}
                rx={2}
                ry={2}
                stroke="rgba(168,198,223,0.25)"
              />
              <line
                x1={8}
                y1={21}
                x2={16}
                y2={21}
                stroke="rgba(168,198,223,0.2)"
              />
              <line
                x1={12}
                y1={17}
                x2={12}
                y2={21}
                stroke="rgba(168,198,223,0.2)"
              />
              <path d="M9 9 L12 6 L15 9" stroke="#245C6B" strokeWidth={1.8} />
              <path d="M12 6 L12 14" stroke="#245C6B" strokeWidth={1.8} />
            </svg>
          </div>
        </div>

        {/* Copy */}
        <div className="text-center">
          <h1 className="font-display text-content text-2xl font-bold text-balance">
            {userName
              ? `Hola, ${userName}. Tu espacio está esperándote`
              : "Tu espacio está esperándote"}
          </h1>
          <p className="text-content-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
            Todavía no pertenecés a ningún servidor. Creá el tuyo en segundos o
            uníte a una comunidad existente con un enlace de invitación.
          </p>
        </div>

        {/* Action cards */}
        <div className="space-y-3">
          <ActionCard
            accent
            icon={<Plus size={20} />}
            title="Crear mi primer servidor"
            description="Elegí un nombre e ícono. El resto lo hacemos nosotros: dos canales listos para usar desde el principio."
            cta="Empezar ahora"
            onClick={onCreateClick}
          />
          <ActionCard
            icon={<Link2 size={20} />}
            title="Unirme con un enlace"
            description="¿Tenés un código de invitación? Pegalo acá y entrás al instante."
            cta="Ingresar código"
            onClick={onJoinClick}
          />
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2">
          {FEATURE_PILLS.map(({ icon, label }) => (
            <div
              key={label}
              className="bg-surface-input border-line text-content-subtle flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .home-empty-float { animation: home-empty-float 3s ease-in-out infinite; }
        @keyframes home-empty-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-empty-float { animation: none; }
        }
      `}</style>
    </div>
  );
}
