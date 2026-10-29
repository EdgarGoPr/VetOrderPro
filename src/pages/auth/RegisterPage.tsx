import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/feedback/Toast';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      await register(nombre.trim(), email.trim(), password);
      toast('Registro exitoso. ¡Bienvenido a VetOrder Pro!', 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario.');
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
          Alta de Nuevo Usuario
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl border border-stone-200/90 rounded-2xl sm:px-10 space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h3 className="text-base font-serif font-bold text-stone-900">Crear cuenta</h3>
            <p className="text-xs text-stone-500 font-sans">
              Ingrese sus datos para comenzar a operar.
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
              label="Nombre y Apellido / Matrícula"
              placeholder="Dr. Fernando López"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="medico@veterinaria.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repetir contraseña"
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
              Registrarse
            </Button>
          </form>

          <div className="text-center pt-2 border-t border-stone-100">
            <span className="text-xs text-stone-500">¿Ya tienes una cuenta registrada? </span>
            <Link to="/login" className="text-xs font-semibold text-[#1f4e38] hover:underline">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
