import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SessionBreadcrumb } from '@/components/sessions/SessionBreadcrumb'

// Auth/route protection for /sessions/* is enforced in middleware.ts and again
// inside each page. This layout only provides the navbar + breadcrumb + footer.
export default function SessionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg">
      <Navbar />
      <SessionBreadcrumb />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
