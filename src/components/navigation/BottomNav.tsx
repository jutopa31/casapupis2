'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Camera,
  MessageCircle,
  CheckCircle,
  Menu,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BottomNavProps {
  onMenuToggle: () => void;
}

interface NavItem {
  label: string;
  href: string | null;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  action?: 'menu';
}

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const navItems: NavItem[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Fotos', href: '/fotos-invitados', icon: Camera },
  { label: 'Muro', href: '/muro', icon: MessageCircle },
  { label: 'Confirmar', href: '/confirmar', icon: CheckCircle },
  { label: 'Menu', href: null, icon: Menu, action: 'menu' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BottomNav({ onMenuToggle }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-stone-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = item.href !== null && pathname === item.href;
          const Icon = item.icon;

          // Menu toggle button (no link)
          if (item.action === 'menu') {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={onMenuToggle}
                  className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-stone-500 transition-colors hover:text-[#C9A84C] focus:outline-none"
                  aria-label="Abrir menu"
                >
                  <Icon size={22} strokeWidth={1.8} />
                  <span className="text-[10px] leading-tight font-medium">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          }

          // Standard nav link
          return (
            <li key={item.label}>
              <Link
                href={item.href!}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors ${
                  isActive
                    ? 'text-[#C9A84C]'
                    : 'text-stone-500 hover:text-[#C9A84C]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={isActive ? 26 : 22}
                  strokeWidth={isActive ? 2 : 1.8}
                />
                <span
                  className={`text-[10px] leading-tight ${
                    isActive ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
