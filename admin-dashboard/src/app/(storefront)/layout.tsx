import StorefrontShell from "../../components/layout/storefront-shell"

// Force all storefront routes to render dynamically (SSR, not SSG).
// Storefront pages use useCartStore/useCustomerAuthStore/Link which
// require client-side context unavailable during static prerendering.
export const dynamic = 'force-dynamic'

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return <StorefrontShell>{children}</StorefrontShell>
}
