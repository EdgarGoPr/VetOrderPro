import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Building2, Plus } from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useNavigate } from 'react-router-dom';

export const AccountSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { accounts, activeAccount, setActiveAccount } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeAccount && accounts.length === 0) {
    return (
      <button
        onClick={() => navigate('/cuentas')}
        className="w-full flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Crear primera cuenta
        </span>
      </button>
    );
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/90 hover:bg-white border border-stone-200/90 shadow-2xs hover:border-stone-300 transition-all text-left group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/20"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-[#1f4e38] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0 tracking-wider shadow-xs">
            {activeAccount?.iniciales || 'VO'}
          </div>
          {!compact && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-xs text-stone-900 truncate block">
                  {activeAccount?.nombre || 'Seleccionar cuenta'}
                </span>
              </div>
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-mono">
                {activeAccount?.tipo || 'Cuenta activa'}
              </span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-stone-400 group-hover:text-stone-700 transition-transform shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] font-mono uppercase tracking-widest text-stone-400 flex items-center justify-between">
            <span>Cuentas disponibles</span>
            <span className="text-stone-500">{accounts.length}</span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1">
            {accounts.map(acc => {
              const isSelected = activeAccount?.id === acc.id;
              return (
                <button
                  key={acc.id}
                  onClick={() => {
                    setActiveAccount(acc);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-stone-50 transition-colors text-xs cursor-pointer ${
                    isSelected ? 'bg-[#1f4e38]/5 font-medium text-[#1f4e38]' : 'text-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="w-6 h-6 rounded bg-stone-100 border border-stone-200 text-stone-700 flex items-center justify-center font-serif text-[11px] font-bold shrink-0">
                      {acc.iniciales}
                    </span>
                    <div className="truncate">
                      <p className="truncate">{acc.nombre}</p>
                      <span className="text-[10px] text-stone-400 font-mono">{acc.tipo}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#1f4e38] shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-stone-100 pt-1 mt-1 px-1.5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/cuentas');
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Gestionar cuentas y equipo</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
