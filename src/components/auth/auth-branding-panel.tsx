import Image from "next/image";

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#e8a800,#b37d00)",
  "linear-gradient(135deg,#245C6B,#1C293B)",
  "linear-gradient(135deg,#38A169,#1e5c3a)",
  "linear-gradient(135deg,#6b95bd,#2d5a7a)",
];

const FLOATING_DOTS = [
  { x: "18%", y: "28%", r: 5, color: "#245C6B" },
  { x: "62%", y: "18%", r: 3, color: "#fce3a4" },
  { x: "78%", y: "55%", r: 4, color: "#6b95bd" },
  { x: "32%", y: "72%", r: 3, color: "#38A169" },
  { x: "72%", y: "78%", r: 4, color: "#A8C6DF" },
];

const MOCKUP_ROWS = [
  {
    width: "70%",
    barColor: "rgba(36,92,107,0.6)",
    avatar: "linear-gradient(135deg,#245C6B,#1C293B)",
  },
  {
    width: "55%",
    barColor: "rgba(168,198,223,0.2)",
    avatar: "linear-gradient(135deg,#e8a800,#b37d00)",
  },
  {
    width: "85%",
    barColor: "rgba(168,198,223,0.12)",
    avatar: "linear-gradient(135deg,#6b95bd,#2d5a7a)",
  },
  {
    width: "45%",
    barColor: "rgba(56,161,105,0.4)",
    avatar: "linear-gradient(135deg,#38A169,#1e5c3a)",
  },
];

/** Grid de hexagonos decorativo, esquina superior derecha del panel. */
function HexGrid() {
  const hexagons = [0, 1, 2, 3].flatMap((row) =>
    [0, 1, 2].map((col) => {
      const x = col * 80 + (row % 2) * 40 + 60;
      const y = row * 70 + 60;
      return (
        <polygon
          key={`${row}-${col}`}
          points={`${x},${y - 30} ${x + 26},${y - 15} ${x + 26},${y + 15} ${x},${y + 30} ${x - 26},${y + 15} ${x - 26},${y - 15}`}
          fill="none"
          stroke="#A8C6DF"
          strokeWidth="1"
        />
      );
    }),
  );

  return (
    <svg
      className="absolute top-0 right-0 opacity-[0.07]"
      width="380"
      height="380"
      viewBox="0 0 380 380"
    >
      {hexagons}
    </svg>
  );
}

/** Mockup de una ventana de chat, centrado en el panel de branding. */
function BrandingMockupCard() {
  return (
    <div className="relative my-8 flex flex-1 flex-col items-center justify-center">
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{
          background: "rgba(28, 41, 59, 0.7)",
          border: "1px solid rgba(168,198,223,0.15)",
          backdropFilter: "blur(20px)",
          transform: "perspective(800px) rotateY(-6deg) rotateX(2deg)",
        }}
      >
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{
            background: "rgba(0,0,0,0.2)",
            borderBottom: "1px solid rgba(168,198,223,0.08)",
          }}
        >
          <div className="size-2 rounded-full" style={{ background: "#e05252" }} />
          <div className="size-2 rounded-full" style={{ background: "#F0B232" }} />
          <div className="size-2 rounded-full" style={{ background: "#38A169" }} />
          <div
            className="mx-3 h-3 flex-1 rounded-full"
            style={{ background: "rgba(168,198,223,0.08)" }}
          />
        </div>
        <div className="space-y-3 p-4">
          {MOCKUP_ROWS.map((row) => (
            <div key={row.width} className="flex items-center gap-3">
              <div
                className="size-7 shrink-0 rounded-full"
                style={{ background: row.avatar }}
              />
              <div
                className="h-2.5 rounded-full"
                style={{ width: row.width, background: row.barColor }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
        <div
          className="absolute top-[40%] right-[25%] size-[300px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(252,227,164,0.08) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Hex grid + floating dots */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <HexGrid />
        {FLOATING_DOTS.map((dot) => (
          <div
            key={`${dot.x}-${dot.y}`}
            className="absolute rounded-full"
            style={{
              left: dot.x,
              top: dot.y,
              width: dot.r * 2,
              height: dot.r * 2,
              background: dot.color,
              boxShadow: `0 0 ${dot.r * 5}px ${dot.color}90`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <Image
        src="/logo-light.png"
        alt="discordia"
        width={1010}
        height={269}
        priority
        className="relative h-auto w-56"
      />

      <BrandingMockupCard />

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
