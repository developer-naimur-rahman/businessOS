import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  // 1. Explicit production or custom environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
  }

  // 2. Client-side browser dynamic resolution
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    const protocol = window.location.protocol

    // Only for numeric LAN IP addresses (e.g. 192.168.0.104, 10.0.0.5) on local Wi-Fi:
    const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.endsWith(".local")
    if (isLanIp) {
      return `${protocol}//${hostname}:3333/api`
    }

    // Cloud domains (e.g. *.vercel.app, yourdomain.com):
    // NEVER append :3333 on cloud production domains! Use relative /api or same origin
    const isCloudDomain = hostname.includes(".vercel.app") || (!isLanIp && hostname !== "localhost" && hostname !== "127.0.0.1")
    if (isCloudDomain) {
      return "/api"
    }
  }

  // 3. Localhost fallback
  return "http://127.0.0.1:3333/api"
}
