import Image from 'next/image';

export type PhotoSource = { src: string; alt: string; width?: number; height?: number };

type PhotoProps = {
  image: PhotoSource | null;
  /** Largeur réellement occupée à l'écran, pour que next/image serve la bonne taille. */
  sizes: string;
  className?: string;
  /** À réserver à l'image LCP (hero). */
  priority?: boolean;
  position?: string;
  reveal?: boolean;
  quality?: number;
  /** Ratio du cadre (ex. « 4 / 5 ») quand il n'est pas fixé par une classe CSS. */
  aspect?: string;
  /** Ordre d'apparition dans une série (décalage de la révélation). */
  index?: number;
  alt?: string;
};

/**
 * Photographie en `fill` dans un cadre dimensionné par CSS : aucun décalage de mise en page.
 * Le fond du cadre sert de repli sobre si le fichier ne se charge pas (voir Motion.tsx).
 */
export function Photo({ image, sizes, className = '', priority, position, reveal = true, quality, aspect, index, alt }: PhotoProps) {
  const style: Record<string, string | number> = {};
  if (aspect) style.aspectRatio = aspect;
  if (index !== undefined) style['--i'] = index;
  return (
    <div className={`photo ${image ? '' : 'photo--empty'} ${className}`} data-reveal={reveal ? 'photo' : undefined} style={style}>
      {image && (
        <Image
          src={image.src}
          alt={alt ?? image.alt}
          fill
          sizes={sizes}
          priority={priority}
          quality={quality}
          style={position ? { objectPosition: position } : undefined}
        />
      )}
    </div>
  );
}
