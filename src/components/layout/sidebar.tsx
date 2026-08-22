'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useForexStore } from '@/lib/store';
import {
  LayoutDashboard,
  TrendingUp,
  Calendar,
  Newspaper,
  Brain,
  LineChart,
  BookOpen,
  Users,
  Gauge,
  GitCompareArrows,
  Zap,
  Grid3X3,
  Search,
  FlaskConical,
  Waypoints,
  ShieldCheck,
  NotebookPen,
  Bell,
  Star,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Timer,
  Boxes,
  Sparkles,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Pasar',
    items: [
      { href: '/dashboard', label: 'Dasbor', icon: LayoutDashboard },
      { href: '/market', label: 'Pasar', icon: TrendingUp },
      { href: '/calendar', label: 'Kalender Ekonomi', icon: Calendar },
      { href: '/news', label: 'Berita Langsung', icon: Newspaper },
    ],
  },
  {
    label: 'Analisis',
    items: [
      { href: '/technical', label: 'Analisis Teknikal', icon: LineChart },
      { href: '/smc', label: 'Smart Money (SMC)', icon: Boxes },
      { href: '/fundamental', label: 'Analisis Fundamental', icon: BookOpen },
      { href: '/sentiment', label: 'Sentimen', icon: Users },
      { href: '/strength', label: 'Kekuatan Mata Uang', icon: Gauge },
      { href: '/correlation', label: 'Korelasi', icon: GitCompareArrows },
    ],
  },
  {
    label: 'AI & Sinyal',
    items: [
      { href: '/action-plan', label: 'Rencana Harian AI', icon: Sparkles },
      { href: '/time-signal', label: 'Sinyal Waktu & TP/CL', icon: Timer },
      { href: '/prediction', label: 'Prediksi AI', icon: Brain },
      { href: '/signals', label: 'Sinyal', icon: Zap },
      { href: '/heatmap', label: 'Peta Panas', icon: Grid3X3 },
      { href: '/scanner', label: 'Pemindai', icon: Search },
    ],
  },
  {
    label: 'Alat',
    items: [
      { href: '/backtest', label: 'Uji Balik', icon: FlaskConical },
      { href: '/strategy', label: 'Strategi', icon: Waypoints },
      { href: '/risk', label: 'Manajemen Risiko', icon: ShieldCheck },
    ],
  },
  {
    label: 'Pribadi',
    items: [
      { href: '/journal', label: 'Jurnal Trading', icon: NotebookPen },
      { href: '/alerts', label: 'Peringatan', icon: Bell },
      { href: '/watchlist', label: 'Daftar Pantau', icon: Star },
      { href: '/settings', label: 'Pengaturan', icon: Settings },
    ],
  },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useForexStore((s) => s.sidebarOpen);
  const toggleSidebar = useForexStore((s) => s.toggleSidebar);
  const isBeginnerMode = useForexStore((s) => s.isBeginnerMode);

  // Simplified navigation for beginner mode
  const BEGINNER_SECTIONS = [
    {
      label: 'Menu Utama Pemula',
      items: [
        { href: '/dashboard', label: 'Dasbor Panduan', icon: LayoutDashboard },
        { href: '/action-plan', label: 'Rencana Harian AI ⭐', icon: Sparkles },
        { href: '/time-signal', label: 'Sinyal TP/CL Siap Copy', icon: Timer },
        { href: '/risk', label: 'Kalkulator Lot & Cent', icon: ShieldCheck },
        { href: '/calendar', label: 'Jadwal Bahaya Berita', icon: Calendar },
      ],
    },
    {
      label: 'Belajar & Riwayat',
      items: [
        { href: '/journal', label: 'Buku Catatan Trading', icon: NotebookPen },
        { href: '/news', label: 'Kabar Pasar Santai', icon: Newspaper },
        { href: '/settings', label: 'Pengaturan & Akun', icon: Settings },
      ],
    },
  ];

  const sectionsToRender = isBeginnerMode ? BEGINNER_SECTIONS : NAV_SECTIONS;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200 lg:static ${
          sidebarOpen
            ? 'w-64 translate-x-0 lg:w-56'
            : '-translate-x-full lg:w-14 lg:translate-x-0'
        }`}
      >
        {/* Collapse toggle */}
        <div className="flex h-12 items-center justify-between border-b border-zinc-800 px-3">
          <span className="text-xs font-bold text-zinc-200 tracking-wider lg:hidden">
            MENU TERMINAL
          </span>
          <button
            onClick={toggleSidebar}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white ml-auto"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sectionsToRender.map((section) => (
            <div key={section.label} className="mb-1">
              <span className={`block px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-600 ${!sidebarOpen && 'lg:hidden'}`}>
                {section.label}
              </span>
              {section.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      // On mobile screen, close drawer after clicking link
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        toggleSidebar();
                      }
                    }}
                    title={sidebarOpen ? undefined : item.label}
                    className={`mx-1.5 mb-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? 'bg-zinc-900 text-emerald-400 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className={`truncate ${!sidebarOpen && 'lg:hidden'}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Live Status Badge */}
        <div className="border-t border-zinc-800 p-2">
          <div
            className={`data-label flex items-center gap-1.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 ${
              sidebarOpen ? 'px-2.5 py-1.5 text-[10px]' : 'justify-center px-1 py-1.5 text-[9px]'
            }`}
          >
            <ShieldCheck size={12} className="shrink-0 text-emerald-400" />
            <span className={`font-semibold uppercase tracking-wider ${!sidebarOpen && 'lg:hidden'}`}>
              Terminal Live (PRO)
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
