import React from 'react';
import { Link, NavLink } from 'react-router-dom';

type NavItem = {
  label: string;
  to: string;
};

const navItems: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Sessions', to: '/sessions' },
  { label: 'Settings', to: '/settings' },
];

const baseLinkClasses =
  'inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200';

const NavBar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/95 dark:supports-[backdrop-filter]:bg-slate-950/80">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight text-slate-900 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-slate-50 dark:focus:ring-offset-slate-950"
          aria-label="Go to homepage"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
            S74
          </span>
          <span>Session 74</span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                [
                  baseLinkClasses,
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
