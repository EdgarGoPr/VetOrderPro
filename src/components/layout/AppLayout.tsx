import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { AccountSelector } from './AccountSelector';
import { ClipboardList } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbfaf7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#1f4e38]/20 border-t-[#1f4e38] rounded-full animate-spin" />
          <span className="text-xs uppercase font-mono tracking-widest text-stone-500">
            Cargando VetOrder Pro...
          </span>
        </div>
      </div>
    );
  }

  // Protected route check
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#fbfaf7] flex flex-col md:flex-row font-sans text-stone-900">
      {/* Desktop Sidebar (hidden when printing) */}
      <div className="hidden md:block no-print">
        <Sidebar />
      </div>

      {/* Mobile Top Header (hidden when printing) */}
      <header className="md:hidden bg-[#f6f4ee] border-b border-[#e7e3d8] p-3 flex items-center justify-between sticky top-0 z-30 no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1f4e38] text-white flex items-center justify-center shadow-xs">
            <ClipboardList className="w-4 h-4 text-emerald-200" />
          </div>
          <span className="font-serif font-bold text-base text-[#14261c]">
            VetOrder <span className="text-[#1f4e38] italic font-normal">Pro</span>
          </span>
        </div>
        <div className="w-48">
          <AccountSelector compact={true} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full min-h-screen pb-20 md:pb-8 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation (hidden when printing) */}
      <MobileNav />
    </div>
  );
};
