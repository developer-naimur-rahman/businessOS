import AdminShell from "../../components/layout/admin-shell"

// Force all admin routes to render dynamically (SSR, not SSG).
// Admin pages use useRouter/usePathname/useAuthStore which require
// the App Router context — unavailable during static prerendering.
export const dynamic = 'force-dynamic'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
