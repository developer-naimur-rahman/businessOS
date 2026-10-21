import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  // 1. Explicit production or custom environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // 2. Client-side browser dynamic resolution (works seamlessly across mobile, tablet, other LAN devices)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    const protocol = window.location.protocol
    // When accessed from another device via LAN IP (e.g. 192.168.x.x, 10.x.x.x) or domain name
    if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:3333/api`
    }
  }

  // 3. Localhost fallback
  return "http://127.0.0.1:3333/api"
}
