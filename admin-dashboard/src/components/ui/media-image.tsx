"use client"
import React, { useState } from "react";
import Image from "next/image";
import { MediaAsset } from "../../types/media";
import { resolveMediaUrl } from "../../lib/media-resolver";
import { Image as ImageIcon } from "lucide-react";

interface MediaImageProps extends Omit<React.ComponentPropsWithoutRef<typeof Image>, "src" | "alt"> {
  asset?: MediaAsset | string | null;
  alt?: string;
  fallbackUrl?: string;
}

export function MediaImage({ 
  asset, 
  alt, 
  fallbackUrl, 
  className, 
  priority,
  fill,
  quality,
  placeholder,
  blurDataURL,
  unoptimized,
  loader,
  ...props 
}: MediaImageProps) {
  const [error, setError] = useState(false);
  const src = resolveMediaUrl(asset, fallbackUrl);

  const displayAlt = alt || asset?.alt || asset?.title || "Media image";

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
        <ImageIcon className="w-1/4 h-1/4 opacity-20" />
      </div>
    );
  }

  // Use standard img for external/demo URLs to avoid Next.js domain config issues during development.
  // When Cloudinary is integrated, we can switch to Next.js Image with properly configured domains.
  return (
    <img
      src={src}
      alt={displayAlt}
      onError={() => setError(true)}
      className={`object-cover ${className}`}
      {...(props as any)}
    />
  );
}
