import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useToast } from '../../components/feedback/Toast';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  User as UserIcon,
  Mail,
  Lock,
  KeyRound,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, isAdmin, updateProfile } = useAuth();
  const { accounts } = useAccount();
  const { toast } = useToast();

  // Personal Info State
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Accounts where user is member
  const userAccounts = accounts.filter(acc =>
    isAdmin ? true : acc.miembros?.includes(user?.id || '')
  );

  // Handle saving personal info (name & email)
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast('El nombre es obligatorio', 'error');
      return;
    }
    if (!email.trim()) {
      toast('El correo electrónico es obligatorio', 'error');
      return;
    }

    try {
      setSavingInfo(true);
      await updateProfile({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
      });
      toast('Tus datos personales fueron actualizados correctamente', 'success');
    } catch (err: any) {
      toast(err.message || 'Error al actualizar los datos', 'error');
    } finally {
      setSavingInfo(false);
    }
  };

  // Handle changing password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast('Por favor ingrese su contraseña actual para confirmar', 'error');
      return;
    }
    if (!newPassword) {
      toast('Ingrese una nueva contraseña', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('Las contraseñas no coinciden', 'error');
      return;
    }

    try {
      setSavingPass(true);
      await updateProfile({
        nombre: user?.nombre || '',
        email: user?.email || '',
        currentPassword,
        newPassword,
      });
      toast('Tu contraseña fue modificada exitosamente', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast(err.message || 'Error al cambiar la contraseña', 'error');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
          Mi perfil y credenciales
        </h1>
        <p className="text-xs text-stone-500 mt-1 font-sans">
          Gestiona tu información de contacto, correo electrónico y contraseña de acceso.
        </p>
      </div>

      {/* User Hero Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1f4e38] to-[#2e7454] text-white flex items-center justify-center font-bold text-2xl shadow-sm shrink-0 border-2 border-emerald-100">
            {user?.nombre ? user.nombre[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-stone-900">{user?.nombre}</h2>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                  isAdmin
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                {isAdmin ? 'Administrador' : 'Usuario Operador'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-stone-400" />
              {user?.email}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-600">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#1f4e38]" />
                {userAccounts.length} {userAccounts.length === 1 ? 'cuenta asignada' : 'cuentas asignadas'}
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sesión activa
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 max-w-xs">
            <p className="font-semibold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Permisos totales
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Como administrador, puedes editar tanto tu perfil aquí como el de cualquier otro usuario desde la sección <strong>Cuentas y equipo</strong>.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Datos Personales (Nombre y Mail) */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-[#1f4e38]" />
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">Datos personales</h3>
              <p className="text-[11px] text-stone-500">Actualiza tu nombre y correo electrónico</p>
            </div>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-4">
            <Input
              label="Nombre y Apellido / Matrícula"
              placeholder="Ej: Dra. Valentina Paz"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              helperText="Nombre visible en tus órdenes de compra"
              required
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu-correo@veterinaria.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              helperText="Utilizado para iniciar sesión en la plataforma"
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={savingInfo}
                className="w-full sm:w-auto"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Guardar cambios personales
              </Button>
            </div>
          </form>
        </div>

        {/* Form 2: Contraseña */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-5">
          <div className="border-b border-stone-100 pb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#1f4e38]" />
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">Seguridad y contraseña</h3>
              <p className="text-[11px] text-stone-500">Cambia tu clave de acceso a VetOrder Pro</p>
            </div>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="relative">
              <Input
                label="Contraseña actual"
                type={showCurrentPass ? 'text' : 'password'}
                placeholder="Ingresa tu clave actual"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-8.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                title={showCurrentPass ? 'Ocultar' : 'Mostrar'}
              >
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Nueva contraseña"
                type={showNewPass ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                helperText="Elige una clave segura"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-8.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                title={showNewPass ? 'Ocultar' : 'Mostrar'}
              >
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Input
              label="Confirmar nueva contraseña"
              type={showNewPass ? 'text' : 'password'}
              placeholder="Repite la nueva contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="outline"
                loading={savingPass}
                className="w-full sm:w-auto"
                icon={<KeyRound className="w-4 h-4 text-[#1f4e38]" />}
              >
                Actualizar contraseña
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Accounts List for this User */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#1f4e38]" />
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Tus cuentas y establecimientos asignados
              </h3>
              <p className="text-[11px] text-stone-500">
                {isAdmin
                  ? 'Como administrador, tienes visibilidad sobre todos los establecimientos registrados.'
                  : 'Cuentas donde tu usuario figura como miembro habilitado para operar.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-stone-500">
            {userAccounts.length} {userAccounts.length === 1 ? 'cuenta' : 'cuentas'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {userAccounts.map(acc => (
            <div
              key={acc.id}
              className="p-3.5 rounded-xl border border-stone-200/80 bg-stone-50/60 flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1f4e38]/10 text-[#1f4e38] font-bold text-xs flex items-center justify-center shrink-0 border border-[#1f4e38]/20">
                {acc.iniciales}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-stone-900 truncate">{acc.nombre}</p>
                <p className="text-[10px] text-stone-500 font-mono">{acc.tipo}</p>
                {acc.bajada && (
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">{acc.bajada}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
