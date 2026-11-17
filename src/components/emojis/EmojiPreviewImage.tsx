const OBJECT_URL_PREFIX = "blob:";

interface EmojiPreviewImageProps {
  objectUrl: string | null;
  className?: string;
}

export function EmojiPreviewImage({
  objectUrl,
  className,
}: EmojiPreviewImageProps) {
  if (objectUrl === null || !objectUrl.startsWith(OBJECT_URL_PREFIX)) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- object URL local: next/image no lo puede optimizar
    <img src={objectUrl} alt="" className={className} />
  );
}
