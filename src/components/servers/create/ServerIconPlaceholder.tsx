import { getInitial } from "@discordia/client-shared";
import { Camera } from "lucide-react";

export function ServerIconPlaceholder({
  name,
  size = 96,
}: {
  name: string;
  size?: number;
}) {
  const initial = getInitial(name);

  return (
    <div
      className="from-accent-gradient-start border-line-strong to-accent-gradient-end flex shrink-0 items-center justify-center rounded-full border-2 border-dashed bg-gradient-to-br"
      style={{ width: size, height: size }}
    >
      {initial ? (
        <span
          className="font-display font-bold text-white"
          style={{ fontSize: size * 0.42 }}
        >
          {initial}
        </span>
      ) : (
        <Camera size={size * 0.32} className="text-white/50" />
      )}
    </div>
  );
}
