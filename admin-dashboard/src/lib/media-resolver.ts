import { MediaAsset } from "../types/media";

/**
 * Resolves a MediaAsset into a usable image URL.
 * In the future, this will handle Cloudinary URL generation (e.g. transformations).
 */
export function resolveMediaUrl(asset?: MediaAsset | string | null, fallbackUrl: string = '/demo/placeholders/fallback.webp'): string {
  if (!asset) {
    return fallbackUrl;
  }

  if (typeof asset === 'string') {
    return asset;
  }

  switch (asset.sourceType) {
    case "cloudinary":
      // Future: Generate Cloudinary URL using publicId, applying required transformations
      return asset.url || fallbackUrl;
      
    case "local":
    case "external":
    case "placeholder":
    case "upload":
    default:
      return asset.url || fallbackUrl;
  }
}
