import Image from "next/image";

/**
 * Logo de las pantallas de autenticacion
 */
export function AuthLogo() {
  return (
    <div className="mb-8 lg:hidden">
      <Image
        src="/logo-light.png"
        alt="discordia"
        width={1010}
        height={269}
        priority
        className="mx-auto h-auto w-48 [[data-theme=light]_&]:hidden"
      />
      <Image
        src="/logo.png"
        alt="discordia"
        width={1010}
        height={269}
        priority
        className="mx-auto hidden h-auto w-48 [[data-theme=light]_&]:block"
      />
    </div>
  );
}
