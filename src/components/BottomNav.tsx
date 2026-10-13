import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Navigation2, CreditCard, Users, Plus } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const [pathname, setPathname] = useState('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  const links = [
    { label: 'Inicio', href: '/', icon: LayoutDashboard },
    { label: 'Ruta Hoy', href: '/daily', icon: Navigation2 },
    { label: 'Crear', href: '/loans/new', icon: Plus, isAction: true },
    { label: 'Préstamos', href: '/loans', icon: CreditCard },
    { label: 'Clientes', href: '/borrowers', icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pointer-events-none pb-safe">
      <div className="max-w-md mx-auto px-4 pb-3 pointer-events-auto">
        <nav className="glass-nav rounded-3xl p-2 shadow-xl shadow-slate-900/10 flex items-center justify-around border border-slate-200/80 bg-white/95 backdrop-blur-xl">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.isAction ? false : (link.href === '/' ? pathname === '/' : pathname.startsWith(link.href));

            if (link.isAction) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center justify-center -mt-6 group active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 border-4 border-white">
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 mt-0.5">
                    {link.label}
                  </span>
                </a>
              );
            }

            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
                  isActive ? 'text-sky-600 font-bold bg-sky-50/80' : 'text-slate-400 font-medium hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] tracking-tight">{link.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
