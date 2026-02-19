'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  Home,
  Camera,
  CheckCircle,
  MessageSquare,
  BookHeart,
  MapPin,
  Grid3X3,
  ListMusic,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import InstallAppButton from '@/components/InstallAppButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

// ---------------------------------------------------------------------------
// Navigation data
// ---------------------------------------------------------------------------

const primaryLinks: NavLink[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Fotos', href: '/fotos-invitados', icon: Camera },
  // { label: 'Confirmar', href: '/confirmar', icon: CheckCircle },
  { label: 'Muro', href: '/muro', icon: MessageSquare },
];

const secondaryLinks: NavLink[] = [
  { label: 'Nuestra Historia', href: '/nuestra-historia', icon: BookHeart },
  { label: 'Como Llegar', href: '/como-llegar', icon: MapPin },
  { label: 'Bingo Fotografico', href: '/bingo', icon: Grid3X3 },
  { label: 'Playlist', href: '/playlist', icon: ListMusic },
  // { label: 'Programa', href: '/programa', icon: Clock },
  { label: 'Agradecimiento', href: '/agradecimiento', icon: HeartHandshake },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DesktopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpen(false);
  }, [pathname]);

  /** Whether any secondary link is currently active */
  const isSecondaryActive = secondaryLinks.some(
    (link) => pathname === link.href,
  );

  return (
    <header className="fixed top-0 inset-x-0 z-50 hidden md:block bg-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link
          href="/"
          className="font-serif text-2xl tracking-widest text-[#C9A84C] hover:opacity-80 transition-opacity"
        >
          J & J
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {/* Primary links */}
          {primaryLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[#C9A84C]'
                    : 'text-stone-600 hover:text-[#C9A84C]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
                {/* Active underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#C9A84C]" />
                )}
              </Link>
            );
          })}

          {/* "Mas" dropdown for secondary links */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1 px-4 py-2 text-sm font-medium transition-colors ${
                isSecondaryActive || menuOpen
                  ? 'text-[#C9A84C]'
                  : 'text-stone-600 hover:text-[#C9A84C]'
              }`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              Mas
              <ChevronDown
                size={16}
                className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
              {isSecondaryActive && !menuOpen && (
                <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#C9A84C]" />
              )}
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-stone-200 shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
                {secondaryLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                          : 'text-stone-700 hover:bg-stone-50 hover:text-[#C9A84C]'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon size={16} strokeWidth={1.6} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <div className="border-t border-stone-100 mt-1 pt-1 px-1">
                  <InstallAppButton />
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
