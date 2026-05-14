import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Atmolead',
  description: 'Scraping leads — partenaires Leroy Merlin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-text">
        <div className="flex min-h-screen">
          <aside className="w-60 border-r border-border bg-surface px-4 py-6">
            <div className="mb-8">
              <div className="text-lg font-semibold">Atmolead</div>
              <div className="text-xs text-text-muted">Extension Atmo</div>
            </div>
            <nav className="space-y-1 text-sm">
              <NavLink href="/">Leads</NavLink>
              <NavLink href="/executions">Exécutions</NavLink>
              <NavLink href="/config">Configuration</NavLink>
            </nav>
          </aside>
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-text-muted hover:bg-surface-2 hover:text-text"
    >
      {children}
    </Link>
  );
}
