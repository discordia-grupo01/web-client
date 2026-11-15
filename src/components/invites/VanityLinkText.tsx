import { displayInviteLink, vanityInviteLink } from "@discordia/client-shared";

export function appOrigin(): string | null {
  return typeof window === "undefined" ? null : window.location.origin;
}

export function vanityLinkPrefix(): string {
  return displayInviteLink(vanityInviteLink("", appOrigin()));
}

export function VanityLinkText({ code }: { code: string }) {
  return (
    <span className="min-w-0 truncate">
      {vanityLinkPrefix()}
      <strong className="text-boost-band-highlight">{code}</strong>
    </span>
  );
}
