const LOGO = {
  deep: "#1C293B",
  petrol: "#245C6B",
  sky: "#A8C6DF",
  steel: "#6B95BD",
  yellow: "#F0B232",
  paper: "#F5F2EB",
} as const;

type IconProps = { size?: number; className?: string };

export const DiscordiaPremiumIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="14" width="7" height="7" rx="1.2" fill={LOGO.petrol} />
    <rect x="5" y="6" width="7" height="7" rx="1.2" fill={LOGO.sky} />
    <rect x="13" y="3" width="7" height="7" rx="1.2" fill={LOGO.yellow} />
    <path
      d="M12 9.5h1"
      stroke={LOGO.deep}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const DiscordiaPointIcon = ({ size = 16, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M4 5v5c0 3 2 5 5 5h3"
      fill="none"
      stroke={LOGO.sky}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle
      cx="16.5"
      cy="15"
      r="4.5"
      fill={LOGO.yellow}
      stroke={LOGO.petrol}
      strokeWidth="1.5"
    />
    <circle cx="16.5" cy="15" r="1.2" fill={LOGO.deep} />
  </svg>
);

export const DiscordiaPremiumMark = ({ size = 120, className }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="4" width="112" height="112" rx="26" fill={LOGO.yellow} />
    <g transform="translate(60 60) scale(0.84) translate(-68.75 -65)">
      <path
        d="M62 26 h4 a34 34 0 0 1 0 68 h-4"
        fill="none"
        stroke={LOGO.deep}
        strokeWidth="15"
      />
      <rect x="46" y="19" width="15" height="14" rx="1.5" fill={LOGO.deep} />
      <rect x="46" y="35" width="15" height="11" rx="1.5" fill={LOGO.steel} />
      <rect x="46" y="48" width="15" height="11" rx="1.5" fill={LOGO.sky} />
      <rect x="46" y="61" width="15" height="11" rx="1.5" fill={LOGO.steel} />
      <rect x="46" y="74" width="15" height="10" rx="1.5" fill={LOGO.sky} />
      <rect x="46" y="86" width="15" height="15" rx="1.5" fill={LOGO.deep} />
      <path
        d="M39 53.5 h7 M34.5 58 V98 a8 8 0 0 0 8 8 H86"
        fill="none"
        stroke={LOGO.deep}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <rect x="30" y="49" width="9" height="9" rx="1.2" fill={LOGO.petrol} />
      <circle cx="90" cy="106" r="5" fill={LOGO.deep} />
    </g>
  </svg>
);

const BADGE_HEXAGON = "0,-50 43.3,-25 43.3,25 0,50 -43.3,25 -43.3,-25";
const BADGE_DETAIL_MIN_SIZE = 28;

export const DiscordiaPremiumBadge = ({ size = 40, className }: IconProps) => {
  const showModules = size >= BADGE_DETAIL_MIN_SIZE;
  const outlineWidth = Math.max(2, 108 / size);

  return (
    <svg
      width={(size * 96) / 108}
      height={size}
      viewBox="-48 -54 96 108"
      className={className}
      aria-hidden="true"
    >
      <polygon
        points={BADGE_HEXAGON}
        fill={LOGO.deep}
        stroke={LOGO.yellow}
        strokeWidth={outlineWidth}
        strokeLinejoin="round"
      />
      <g transform="scale(0.8) translate(-340 -100)">
        <path d="M326 68 H342 A32 32 0 0 1 342 132 H326 Z" fill={LOGO.paper} />
        <path d="M334 82 H342 A18 18 0 0 1 342 118 H334 Z" fill={LOGO.deep} />
        {showModules ? (
          <>
            <rect x="310" y="70" width="13" height="12" rx="2" fill={LOGO.sky} />
            <rect x="310" y="85" width="13" height="12" rx="2" fill={LOGO.sky} />
            <rect x="310" y="118" width="13" height="12" rx="2" fill={LOGO.sky} />
          </>
        ) : null}
        <rect x="306" y="100" width="17" height="15" rx="2" fill={LOGO.yellow} />
      </g>
    </svg>
  );
};
