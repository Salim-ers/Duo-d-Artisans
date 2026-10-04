/**
 * Compression d'image dans le navigateur avant envoi (≤ 2000 px, WebP) :
 * envois rapides sur mobile et sous la limite de 4,5 Mo d'une requête Vercel.
 * En cas d'échec (format exotique), le fichier d'origine est conservé.
 */
export async function compressImage(file: File, max = 2000, quality = 0.82): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file;
  }
}
