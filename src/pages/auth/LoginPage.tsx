import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, Shield, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/feedback/Toast';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState('admin@vetorder.pro');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await login(email, password);
      toast('Sesión iniciada correctamente', 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setError(null);
    try {
      setLoading(true);
      setEmail(userEmail);
      setPassword('password123');
      await login(userEmail, 'password123');
      toast(`Sesión iniciada como ${userEmail}`, 'success');
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1f4e38] text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-7 h-7 text-emerald-200" />
          </div>
        </div>
        <h2 className="text-center font-serif text-3xl font-extrabold text-[#14261c] tracking-tight">
          VetOrder <span className="text-[#1f4e38] italic font-normal">Pro</span>
        </h2>
        <p className="mt-1 text-center text-xs uppercase font-mono tracking-widest text-stone-500">
          Gestión de Órdenes de Compra Veterinarias
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-stone-200/90 rounded-2xl sm:px-10 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-base font-serif font-bold text-stone-900">Iniciar sesión</h3>
            <p className="text-xs text-stone-500 font-sans">
              Ingrese con sus credenciales autorizadas.
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="veterinario@feedlot.com"
              required
            />

            <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="flex justify-end mt-1">
                <Link
                  to="/recuperar"
                  className="text-[11px] text-[#1f4e38] hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-sm font-semibold"
            >
              Ingresar a la plataforma
            </Button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="pt-4 border-t border-stone-100 space-y-2.5">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 bg-white px-2">
                Acceso rápido demo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@vetorder.pro')}
                className="flex items-center gap-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70 transition-colors text-left text-xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-amber-900 truncate">Dr. Rossi</p>
                  <span className="text-[9px] font-mono text-amber-700 block">Rol Admin</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('veterinario@feedlot.com')}
                className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/70 transition-colors text-left text-xs cursor-pointer group"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-200/80 text-emerald-900 flex items-center justify-center shrink-0">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-semibold text-emerald-900 truncate">Dra. Paz</p>
                  <span className="text-[9px] font-mono text-emerald-700 block">Rol Usuario</span>
                </div>
              </button>
            </div>
          </div>

          <div className="text-center pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-500">¿No tienes una cuenta aún? </span>
            <Link to="/registro" className="text-xs font-semibold text-[#1f4e38] hover:underline">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
