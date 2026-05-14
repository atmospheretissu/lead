'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Activity, Settings, Zap } from 'lucide-react';
import { ColorChip, type ChipTone } from '@/components/ui/StatusPill';
import { cn } from '@/lib/utils';

type Item = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  tone: ChipTone;
};

const items: Item[] = [
  { label: 'Leads', href: '/', icon: Users, tone: 'pink' },
  { label: 'Exécutions', href: '/executions', icon: Activity, tone: 'violet' },
  { label: 'Configuration', href: '/config', icon: Settings, tone: 'orange' },
];

function NavLink({ item }: { item: Item }) {
  const pathname = usePathname();
  const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors',
        active
          ? 'border border-line bg-white font-medium text-ink'
          : 'border border-transparent text-ink-3 hover:bg-white/60 hover:text-ink',
      )}
    >
      <ColorChip tone={item.tone} size="sm">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </ColorChip>
      <span className="flex-1 truncate">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[240px] shrink-0 flex-col border-r border-line bg-canvas">
      <div className="flex h-14 items-center gap-2 border-b border-line px-4">
        <ColorChip tone="violet" size="md">
          <Zap className="h-4 w-4" strokeWidth={2.2} />
        </ColorChip>
        <div>
          <div className="text-[14px] font-semibold leading-none">
            <span className="gradient-text">Atmolead</span>
          </div>
          <div className="mt-0.5 text-[10.5px] text-muted">Extension Atmo</div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <div className="px-2.5 pb-1.5 pt-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-2">
            Pipeline
          </p>
        </div>
        {items.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3 text-[11px] text-muted">
        <div>Scraping Leroy Merlin</div>
        <div className="mt-0.5 text-[10.5px]">partenaires.leroymerlin.fr</div>
      </div>
    </aside>
  );
}
