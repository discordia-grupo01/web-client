import {
  LOGO_ANIMATION,
  LOGO_ISOTYPE,
  LOGO_TAGLINE_PATH,
  LOGO_VIEW_BOX,
  LOGO_WORD_PATHS,
} from "@discordia/client-shared";

import type { CSSProperties } from "react";

interface LoadingScreenProps {
  isLeaving?: boolean;
}

/**
 * Logo de Discordia en vectores (datos de client-shared), para animar sus
 * piezas por separado: los bloques se encienden en cadena, un pulso recorre el
 * cable y las letras aparecen una a una.
 */
const {
  cycleMs,
  blocks: blockTiming,
  gold: goldTiming,
  pulse,
  letters,
  tagline,
  dots,
} = LOGO_ANIMATION;

/** Tiempos compartidos con mobile, como variables que lee el CSS. */
const ANIMATION_VARS = {
  "--cycle": `${cycleMs}ms`,
  "--block-step": `${blockTiming.staggerMs}ms`,
  "--block-low": blockTiming.lowOpacity,
  "--gold-scale": 1 + goldTiming.growth,
  "--letter-fade": `${letters.fadeMs}ms`,
  "--tagline-start": `${tagline.startMs}ms`,
  "--tagline-fade": `${tagline.fadeMs}ms`,
} as CSSProperties;

const DOTS_VARS = {
  "--dots-cycle": `${dots.cycleMs}ms`,
  "--dots-stagger": `${dots.staggerMs}ms`,
} as CSSProperties;

function AnimatedLogo() {
  const {
    inkRects,
    dPath,
    dot,
    square,
    cablePaths,
    cableStrokeWidth,
    blocks,
    gold,
  } = LOGO_ISOTYPE;
  return (
    <svg
      viewBox={`0 0 ${LOGO_VIEW_BOX.width} ${LOGO_VIEW_BOX.height}`}
      className="loader-logo h-auto w-full"
      style={ANIMATION_VARS}
      aria-hidden="true"
    >
      <g className="loader-ink">
        {inkRects.map((rect) => (
          <rect key={rect.y} {...rect} />
        ))}
        <path d={dPath} />
        <circle {...dot} />
      </g>
      <rect className="loader-square" {...square} />
      <g
        className="loader-cable"
        fill="none"
        strokeWidth={cableStrokeWidth}
        strokeLinecap="round"
      >
        {cablePaths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <g fill="none" strokeWidth={cableStrokeWidth} strokeLinecap="round">
        {cablePaths.map((d, i) => (
          <path
            key={d}
            className="loader-pulse"
            pathLength={pulse[i].length}
            style={
              {
                "--pulse-dash": pulse[i].dash,
                "--pulse-len": pulse[i].length,
                "--pulse-delay": `${pulse[i].startAt * cycleMs}ms`,
              } as CSSProperties
            }
            d={d}
          />
        ))}
      </g>
      {blocks.map((rect, i) => (
        <rect
          key={rect.y}
          className="loader-block"
          style={{ animationDelay: `${i * blockTiming.staggerMs}ms` }}
          {...rect}
        />
      ))}
      <rect className="loader-gold" {...gold} />
      <g className="loader-ink">
        {LOGO_WORD_PATHS.map((d, i) => (
          <path
            key={i}
            className="loader-letter"
            style={{
              animationDelay: `${letters.startMs + i * letters.staggerMs}ms`,
            }}
            d={d}
          />
        ))}
      </g>
      <path className="loader-tag" d={LOGO_TAGLINE_PATH} />
    </svg>
  );
}

/**
 * Pantalla de carga inicial: se muestra hasta que responden los servicios
 * del home, para no mostrar estados vacios que luego se corrigen.
 */
export function LoadingScreen({ isLeaving = false }: LoadingScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-dvh w-full flex-col items-center justify-center transition-opacity duration-200"
      style={{ background: "var(--bg-chat)", opacity: isLeaving ? 0 : 1 }}
    >
      <div className="loader-stage w-80 max-w-[80vw]">
        <AnimatedLogo />
        <div className="loader-dots" style={DOTS_VARS} aria-hidden="true">
          <span className="loader-dot" />
          <span className="loader-dot" />
          <span className="loader-dot" />
        </div>
      </div>
      <span className="sr-only">Cargando</span>
    </div>
  );
}
