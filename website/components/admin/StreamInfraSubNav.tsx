'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Server, Radio, Monitor, Eye, ChevronRight } from 'lucide-react';

const NAV = [
  {
    label: 'Stream Servers',
    icon: Server,
    items: [
      { label: 'All Servers', href: '/admin/stream-servers' },
    ],
  },
  {
    label: 'Streams',
    icon: Radio,
    items: [
      { label: 'All Streams', href: '/admin/streams' },
      { label: 'Add Stream',  href: '/admin/streams/create' },
    ],
  },
  {
    label: 'Viewer Sessions',
    icon: Eye,
    items: [
      { label: 'Sessions', href: '/admin/viewer-sessions' },
    ],
  },
  {
    label: 'Monitoring',
    icon: Monitor,
    items: [
      { label: 'Dashboard', href: '/admin/monitoring' },
    ],
  },
];

export default function StreamInfraSubNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href.length > 20 && pathname.startsWith(href));

  const isSectionActive = (items: { href: string }[]) =>
    items.some(i => isActive(i.href));

  return (
    <aside className="w-52 shrink-0 hidden lg:flex flex-col gap-1 self-start sticky top-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 pb-2">
        Stream Infrastructure
      </p>

      {NAV.map(section => {
        const Icon = section.icon;
        const sectionActive = isSectionActive(section.items);

        return (
          <div key={section.label} className="space-y-0.5">
            {/* Section header */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
              sectionActive ? 'text-primary' : 'text-slate-500'
            }`}>
              <Icon size={13} className="shrink-0" />
              {section.label}
            </div>

            {/* Section items */}
            {section.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between pl-8 pr-3 py-2 rounded-xl text-sm transition-all duration-150 ${
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  {item.label}
                  {active && <ChevronRight size={13} className="shrink-0" />}
                </Link>
              );
            })}
          </div>
        );
      })}
    </aside>
  );
}
