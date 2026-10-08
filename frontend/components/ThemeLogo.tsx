import Image from "next/image";

export interface ThemeLogoProps {
  alt?: string;
  className?: string;
  imgClassName?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

/**
 * ThemeLogo renders the FyDry logo adapting reactively to the user's color scheme preference.
 * - Light mode: /logo_negro.png
 * - Dark mode: /logo_blanco.png
 * Supports both CSS media queries (prefers-color-scheme: dark) and HTML `.dark` class.
 */
export default function ThemeLogo({
  alt = "FyDry Logo",
  className = "",
  imgClassName = "",
  fill = false,
  width,
  height,
  sizes,
  priority = false,
}: ThemeLogoProps) {
  const commonClasses = [imgClassName, className].filter(Boolean).join(" ");

  const lightClasses = [
    "dark:hidden [@media(prefers-color-scheme:dark)]:hidden",
    commonClasses,
  ]
    .filter(Boolean)
    .join(" ");

  const darkClasses = [
    "hidden dark:block [@media(prefers-color-scheme:dark)]:block",
    commonClasses,
  ]
    .filter(Boolean)
    .join(" ");

  if (fill) {
    return (
      <>
        <Image
          src="/logo_negro.png"
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={lightClasses}
        />
        <Image
          src="/logo_blanco.png"
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={darkClasses}
        />
      </>
    );
  }

  return (
    <>
      <Image
        src="/logo_negro.png"
        alt={alt}
        width={width ?? 32}
        height={height ?? 32}
        sizes={sizes}
        priority={priority}
        className={lightClasses}
      />
      <Image
        src="/logo_blanco.png"
        alt={alt}
        width={width ?? 32}
        height={height ?? 32}
        sizes={sizes}
        priority={priority}
        className={darkClasses}
      />
    </>
  );
}
