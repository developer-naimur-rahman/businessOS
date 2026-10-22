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

  // 2. Server-side Node.js / Vercel Serverless environment
  const customUrl = process.env.BACKEND_INTERNAL_URL;
  if (customUrl && !customUrl.includes("localhost") && !customUrl.includes("127.0.0.1")) {
    return customUrl.replace(/\/+$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api`;
  }

  // Local development only
  return "http://127.0.0.1:3333/api";
}

/**
 * Returns a valid internal NestJS backend URL, or null if running in an isolated
 * environment (such as Vercel) where 127.0.0.1:3333 does not exist.
 * This guarantees serverless functions never hang or timeout waiting on dead ports.
 */
export function getValidBackendUrl(): string | null {
  const customUrl = process.env.BACKEND_INTERNAL_URL;
  if (customUrl && !customUrl.includes("localhost") && !customUrl.includes("127.0.0.1")) {
    return customUrl.replace(/\/+$/, "");
  }

  // In Vercel or cloud production, 127.0.0.1:3333 does NOT exist.
  // Never attempt to connect to it, return null immediately so endpoints use the in-memory demo store.
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    return null;
  }

  // Only allowed during local developer workstation testing
  return "http://127.0.0.1:3333";
}

