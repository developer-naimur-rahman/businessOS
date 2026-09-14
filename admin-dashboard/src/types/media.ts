export type MediaSourceType = 
  | "local" 
  | "external" 
  | "cloudinary" 
  | "upload" 
  | "placeholder";

export interface MediaAsset {
  id?: string;
  sourceType: MediaSourceType;
  url: string;
  publicId?: string;
  alt?: string;
  title?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  provider?: string;
}
