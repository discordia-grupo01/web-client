import { cn } from "@/lib/cn";

interface ServerAvatarProps {
  name: string;
  /** URL de un ícono real. Si es `null`/`undefined`, se muestra el degradado con la inicial. */
  src?: string | null;
  size?: number;
  className?: string;
}


export function ServerAvatar({ name, src, size = 48, className }: ServerAvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className={cn("object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={cn(
        "from-accent flex shrink-0 items-center justify-center bg-gradient-to-br to-[#1a4050] font-display font-bold text-white select-none",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </div>
  );
}
