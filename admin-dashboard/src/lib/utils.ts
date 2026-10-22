import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  // 1. In any client browser environment (mobile phone, tablet, other PCs, or Vercel production):
  if (typeof window !== "undefined") {
    // If running in browser on a remote/deployed host (like vercel.app or any domain/IP):
    // ALWAYS use same-origin relative '/api' so requests never try to reach localhost:3333 on the visitor's device!
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "/api";
    }

    // Only if explicitly testing on local dev machine:
    if (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes("localhost") && !process.env.NEXT_PUBLIC_API_URL.includes("127.0.0.1")) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
    }
    return "/api";
  }

  // 2. Server-side Node.js fallback
  const customUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (customUrl && !customUrl.includes("localhost") && !customUrl.includes("127.0.0.1")) {
    return customUrl.replace(/\/+$/, "");
  }

  return "http://127.0.0.1:3333/api";
}
