import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowLeft, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/feedback/Toast';

export const RecoverPasswordPage: React.FC = () => {
  const { recoverPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [enteredToken, setEnteredToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      const res = await recoverPassword(email.trim());
      setSuccessMsg(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setEnteredToken(res.resetToken); // Pre-fill token for demo convenience
      }
      setStep('reset');
      toast('Código de recuperación generado', 'info');
    } catch (err: any) {
      setError(err.message || 'No fue posible enviar el correo de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!enteredToken.trim()) {
      setError('Debe ingresar el código de recuperación.');
      return;
    }
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email.trim(), newPassword);
      toast('Contraseña restablecida con éxito. Inicie sesión.', 'success');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al restablecer contraseña.');
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
          VetOrder <span className="text-[#1f4e38] italic font-normal">Pro</span>
        </h2>
        <p className="mt-1 text-center text-xs uppercase font-mono tracking-widest text-stone-500">
          Recuperación de Contraseña
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-stone-200/90 rounded-2xl sm:px-10 space-y-6">
          <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-serif font-bold text-stone-900">
                {step === 'request' ? 'Recuperar acceso' : 'Nueva contraseña'}
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                {step === 'request'
                  ? 'Ingrese el correo asociado a su usuario.'
                  : 'Defina su nueva contraseña segura.'}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#1f4e38] flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2.5 text-emerald-900 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <Input
                label="Correo electrónico registrado"
                type="email"
                placeholder="veterinario@feedlot.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 text-[11px] text-stone-600 font-sans">
                Usuarios de prueba disponibles:
                <div className="mt-1 font-mono text-[10px] space-y-0.5 text-stone-800">
                  <div>• admin@vetorder.pro</div>
                  <div>• veterinario@feedlot.com</div>
                  <div>• operaciones@campo.com</div>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full text-sm font-semibold"
              >
                Generar código de recuperación
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Input
                  label="Código o Token de recuperación"
                  value={enteredToken}
                  onChange={e => setEnteredToken(e.target.value)}
                  placeholder="token-..."
                  required
                />
                {resetToken && (
                  <p className="text-[10px] font-mono text-emerald-700 mt-1">
                    Código generado para pruebas: <span className="font-bold">{resetToken}</span>
                  </p>
                )}
              </div>

              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirmar nueva contraseña"
                type="password"
                placeholder="Repita la nueva contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full text-sm font-semibold"
              >
                Actualizar contraseña e ingresar
              </Button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full text-center text-xs text-stone-500 hover:text-stone-800 cursor-pointer pt-1"
              >
                Solicitar otro código
              </button>
            </form>
          )}

          <div className="text-center pt-3 border-t border-stone-100">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
