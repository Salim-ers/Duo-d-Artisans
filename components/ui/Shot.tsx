import Image, { getImageProps } from 'next/image';
import type { Media } from '@/data/media';

type Common = {
  className?: string;
  quality?: number;
  /** Révélation au défilement (masque qui s'ouvre, sans zoom). */
  reveal?: boolean;
  /** Ordre d'apparition dans une série. */
  index?: number;
  caption?: React.ReactNode;
};

const style = (index?: number) => (index === undefined ? undefined : { ['--i' as string]: index });

/**
 * Photographie ENTIÈRE, à son ratio d'origine : largeur 100 %, hauteur automatique.
 * Jamais recadrée (pas d'object-fit: cover sur un cadre arbitraire) ni zoomée.
 * width / height réels : la place est réservée avant le chargement (aucun décalage de mise en page).
 */
export function Shot({ image, sizes, priority, className = '', quality = 90, reveal = true, index, caption }: Common & { image: Media; sizes: string; priority?: boolean }) {
  return (
    <figure className={`shot ${className}`} data-reveal={reveal ? 'shot' : undefined} style={style(index)}>
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes={sizes}
        quality={quality}
        priority={priority}
        fetchPriority={priority ? 'high' : undefined}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/**
 * Même photo, deux présentations (direction artistique) — toujours entière :
 * grand format 16:9 sur grand écran (fichier livré : photo + fond flouté), photo carrée sur téléphone.
 */
export function ArtShot({ wide, square, wideSizes, className = '', quality = 90, reveal = true, index, caption }: Common & { wide: Media; square: Media; wideSizes: string }) {
  const big = getImageProps({ src: wide.src, alt: wide.alt, width: wide.width, height: wide.height, sizes: wideSizes, quality }).props;
  const { srcSet, ...small } = getImageProps({ src: square.src, alt: square.alt, width: square.width, height: square.height, sizes: '100vw', quality }).props;
  return (
    <figure className={`shot ${className}`} data-reveal={reveal ? 'shot' : undefined} style={style(index)}>
      <picture>
        <source media="(min-width: 900px)" srcSet={big.srcSet} sizes={big.sizes} width={big.width} height={big.height} />
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...small} srcSet={srcSet} />
      </picture>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
