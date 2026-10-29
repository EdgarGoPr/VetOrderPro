import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  PlusCircle,
  BookOpen,
  Building2,
  LogOut,
  ShieldCheck,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AccountSelector } from './AccountSelector';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, logout, switchDemoUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      to: '/',
      label: 'Órdenes de compra',
      icon: <ClipboardList className="w-4 h-4" />,
      end: true,
    },
    {
      to: '/pedido/nuevo',
      label: 'Nuevo pedido',
      icon: <PlusCircle className="w-4 h-4" />,
      highlight: true,
    },
    {
      to: '/catalogo',
      label: 'Catálogo de insumos',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      to: '/cuentas',
      label: 'Cuentas y equipo',
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#f6f4ee] border-r border-[#e7e3d8] flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      {/* Top Section */}
      <div className="p-4 space-y-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-9 h-9 rounded-xl bg-[#1f4e38] text-white flex items-center justify-center shadow-xs">
            <ClipboardList className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-[#14261c] tracking-tight flex items-center gap-1">
              VetOrder <span className="text-[#1f4e38] italic font-normal">Pro</span>
            </span>
            <p className="text-[10px] uppercase font-mono tracking-wider text-stone-500 -mt-0.5">
              Gestión Veterinaria
            </p>
          </div>
        </div>

        {/* Account Selector */}
        <div className="pt-1">
          <AccountSelector />
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 pt-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1f4e38] text-white shadow-xs'
                    : item.highlight
                    ? 'text-[#1f4e38] hover:bg-[#1f4e38]/10 bg-white/70 border border-[#1f4e38]/20'
                    : 'text-stone-700 hover:bg-stone-200/60 hover:text-stone-900'
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Section & Role Switcher */}
      <div className="p-4 border-t border-[#e7e3d8] bg-white/40 space-y-3">
        {/* User Card */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.nombre ? user.nombre[0].toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-stone-900 truncate">{user?.nombre}</p>
              <span className="text-[10px] text-stone-500 truncate block font-mono">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Role Pill & Demo Switcher */}
        <div className="flex items-center justify-between bg-stone-100/90 rounded-lg p-2 border border-stone-200/70 text-[11px]">
          <div className="flex items-center gap-1.5 font-medium text-stone-700">
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-800 font-semibold font-mono">Rol: Admin</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800 font-semibold font-mono">Rol: Usuario</span>
              </>
            )}
          </div>

          {/* Quick Demo Switcher */}
          <button
            onClick={() => switchDemoUser(isAdmin ? 'user' : 'admin')}
            title="Cambiar rol para probar permisos"
            className="flex items-center gap-1 text-[10px] font-mono text-stone-500 hover:text-[#1f4e38] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{isAdmin ? 'A Usuario' : 'A Admin'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
