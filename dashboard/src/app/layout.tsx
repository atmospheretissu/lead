import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'Atmolead — Scraping Leroy Merlin',
  description: 'Pipeline de récupération des leads du portail partenaires Leroy Merlin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="canvas-bg min-h-screen text-ink">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 px-10 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
