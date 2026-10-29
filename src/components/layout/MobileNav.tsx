import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, BookOpen, Building2 } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const navItems = [
    {
      to: '/',
      label: 'Pedidos',
      icon: <ClipboardList className="w-5 h-5" />,
      end: true,
    },
    {
      to: '/pedido/nuevo',
      label: 'Nuevo',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      to: '/catalogo',
      label: 'Catálogo',
      icon: <BookOpen className="w-5 h-5" />,
    },
    {
      to: '/cuentas',
      label: 'Cuentas',
      icon: <Building2 className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-2 flex items-center justify-around shadow-lg no-print">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-medium transition-all ${
              isActive
                ? 'text-[#1f4e38] font-bold'
                : 'text-stone-500 hover:text-stone-900'
            }`
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
