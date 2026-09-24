import Image from 'next/image';
import type { Media } from '@/data/media';

type PhotoProps = {
  image: Media;
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
};

/**
 * Photographie en `fill` dans un cadre dimensionné par CSS (aspect-ratio ou hauteur) :
 * aucun décalage de mise en page. Le fond du cadre sert de repli sobre si le
 * fichier ne se charge pas (voir Motion.tsx, qui masque l'image cassée).
 */
export function Photo({ image, sizes, className = '', priority, position, reveal = true, quality, aspect }: PhotoProps) {
  return (
    <div className={`photo ${className}`} data-reveal={reveal ? 'photo' : undefined} style={aspect ? { aspectRatio: aspect } : undefined}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={quality}
        style={position ? { objectPosition: position } : undefined}
      />
    </div>
  );
}
