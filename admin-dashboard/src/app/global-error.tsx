"use client"

// This file must exist to prevent Next.js 16's auto-generated
// _global-error page from crashing during prerendering due to
// useContext(AppRouterContext) being null in the SSR environment.
export const dynamic = 'force-dynamic'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Something went wrong!</h2>
            <p style={{ color: '#6b7280', margin: '1rem 0' }}>An unexpected error occurred.</p>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.5rem 1.5rem',
                backgroundColor: '#04BBFD',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
