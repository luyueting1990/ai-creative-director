import { createId } from "./id";
import { MAX_PHOTO_BYTES, MAX_PHOTOS, type PhotoMeta } from "./schema";

/**
 * A product photo attached to the brief. `url` is an in-memory object URL
 * that only exists for the current page session — it is never uploaded to a
 * server and is not written to localStorage (only `PhotoMeta` is).
 */
export interface PhotoItem extends PhotoMeta {
  url?: string;
}

const ACCEPTED = /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/;

export interface PhotoValidation {
  accepted: File[];
  errors: string[];
}

export function validatePhotoFiles(files: File[], existing: number): PhotoValidation {
  const errors: string[] = [];
  const accepted: File[] = [];
  for (const file of files) {
    if (!ACCEPTED.test(file.type)) {
      errors.push(`“${file.name}” isn't a supported image (JPG, PNG, WebP, GIF, AVIF or HEIC).`);
    } else if (file.size > MAX_PHOTO_BYTES) {
      errors.push(`“${file.name}” is larger than ${MAX_PHOTO_BYTES / 1024 / 1024}MB.`);
    } else if (existing + accepted.length >= MAX_PHOTOS) {
      errors.push(`You can attach up to ${MAX_PHOTOS} photos — “${file.name}” was skipped.`);
    } else {
      accepted.push(file);
    }
  }
  return { accepted, errors };
}

export function toPhotoItem(file: File, makeUrl: (f: File) => string = (f) => URL.createObjectURL(f)): PhotoItem {
  return { id: createId("photo"), name: file.name, size: file.size, type: file.type, url: makeUrl(file) };
}

export function toPhotoMeta({ id, name, size, type }: PhotoItem): PhotoMeta {
  return { id, name, size, type };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Image for a shot: an explicit choice wins ("none" hides it); otherwise
 * product shots take uploaded photos in order, cycling if needed.
 */
export function photoForShot<T extends { id: string; showsProduct: boolean; photoId?: string }>(
  shots: T[],
  index: number,
  photos: PhotoItem[],
): PhotoItem | null {
  const shot = shots[index];
  if (!shot) return null;
  if (shot.photoId === "none") return null;
  if (shot.photoId) return photos.find((p) => p.id === shot.photoId) ?? null;
  if (!shot.showsProduct || photos.length === 0) return null;
  const nth = shots.slice(0, index).filter((s) => s.showsProduct && !s.photoId).length;
  return photos[nth % photos.length];
}
