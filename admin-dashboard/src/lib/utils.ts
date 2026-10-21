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

  // 2. In any client browser environment (mobile phone, tablet, LAN Wi-Fi, or Vercel production):
  // Always use same-origin relative '/api' so requests never cross ports, avoid firewall blocks, and prevent mixed content errors
  if (typeof window !== "undefined") {
    return "/api"
  }

  // 3. Server-side Node.js fallback
  return "http://127.0.0.1:3333/api"
}
