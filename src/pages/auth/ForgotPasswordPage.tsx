import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ForgotPasswordPage: React.FC = () => {
  const { recoverPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSentMessage(null);

    try {
      setLoading(true);
      const res = await recoverPassword(email);
      setSentMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Error al procesar recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1f4e38] text-white flex items-center justify-center shadow-md">
            <ClipboardList className="w-7 h-7 text-emerald-200" />
          </div>
        </div>
        <h2 className="text-center font-serif text-3xl font-extrabold text-[#14261c] tracking-tight">
          Recuperar contraseña
        </h2>
        <p className="mt-1 text-center text-xs uppercase font-mono tracking-widest text-stone-500">
          VetOrder Pro
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-stone-200/90 rounded-2xl sm:px-10 space-y-6">
          {sentMessage ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                Enlace de restablecimiento generado
              </h3>
              <p className="text-xs text-stone-600">{sentMessage}</p>
              <div className="pt-2">
                <Button
                  onClick={() => navigate(`/restablecer?email=${encodeURIComponent(email)}`)}
                  variant="primary"
                  className="w-full"
                >
                  Continuar a ingresar nueva clave
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-stone-600 font-sans">
                Ingrese la dirección de correo con la que se registró para recibir el enlace de
                restablecimiento.
              </p>

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
                  placeholder="veterinario@feedlot.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full text-sm font-semibold"
                >
                  Enviar enlace de recuperación
                </Button>
              </form>
            </>
          )}

          <div className="text-center pt-2 border-t border-stone-100">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1f4e38] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
