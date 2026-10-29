import React, { useEffect, useState } from 'react';
import {
  Plus,
  Users,
  CheckCircle2,
  Edit2,
  Trash2,
  Shield,
  Check,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';
import type { Account, AccountType, User, UserRole } from '../../types';
import { generateInitials } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/feedback/Toast';

const ACCOUNT_TYPES: AccountType[] = [
  'Feedlot',
  'Cliente',
  'Personal',
  'Cabaña',
  'Haras',
  'Veterinaria',
];

export const AccountsPage: React.FC = () => {
  const {
    accounts,
    activeAccount,
    setActiveAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    refreshAccounts,
  } = useAccount();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Account Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Account Form Fields
  const [nombre, setNombre] = useState<string>('');
  const [tipo, setTipo] = useState<AccountType>('Feedlot');
  const [iniciales, setIniciales] = useState<string>('');
  const [bajada, setBajada] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete Account State
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<Account | null>(null);

  // User Creation State (Admin only)
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userNombre, setUserNombre] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRol, setUserRol] = useState<UserRole>('user');
  const [userPassword, setUserPassword] = useState<string>('password123');
  const [assignToActiveAccount, setAssignToActiveAccount] = useState<boolean>(true);
  const [savingUser, setSavingUser] = useState<boolean>(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const usersList = await api.auth.getAllUsers();
      setAllUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingAccount(null);
    setNombre('');
    setTipo('Feedlot');
    setIniciales('');
    setBajada('');
    setActivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setNombre(acc.nombre);
    setTipo(acc.tipo);
    setIniciales(acc.iniciales);
    setBajada(acc.bajada);
    setActivo(acc.activo);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setNombre(val);
    if (!editingAccount && (!iniciales || iniciales.length <= 3)) {
      setIniciales(generateInitials(val));
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast('El nombre de la cuenta es obligatorio', 'error');
      return;
    }

    try {
      setSaving(true);
      const computedInitials = (iniciales || generateInitials(nombre)).toUpperCase().trim();

      if (editingAccount) {
        await updateAccount(editingAccount.id, {
          nombre: nombre.trim(),
          tipo,
          iniciales: computedInitials,
          bajada: bajada.trim(),
          activo,
        });
        toast('Cuenta actualizada con éxito', 'success');
      } else {
        await createAccount({
          nombre: nombre.trim(),
          tipo,
          iniciales: computedInitials,
          bajada: bajada.trim(),
          activo,
          miembros: user ? [user.id] : [],
        });
        toast('Cuenta creada exitosamente', 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Error al guardar la cuenta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountTarget) return;
    try {
      await deleteAccount(deleteAccountTarget.id);
      toast('Cuenta eliminada correctamente', 'success');
      setDeleteAccountTarget(null);
    } catch (err: any) {
      toast(err.message || 'Error al eliminar la cuenta', 'error');
    }
  };

  // Toggle user membership in the active account
  const handleToggleMember = async (userId: string) => {
    if (!activeAccount) return;
    const isMember = activeAccount.miembros?.includes(userId);
    const action = isMember ? 'remove' : 'add';

    try {
      await api.accounts.assignMember(activeAccount.id, userId, action);
      await refreshAccounts();
      toast(
        isMember ? 'Usuario desvinculado de la cuenta' : 'Usuario asignado a la cuenta',
        'info'
      );
    } catch (err: any) {
      toast(err.message || 'Error actualizando miembros', 'error');
    }
  };

  // Create User Handlers
  const openCreateUserModal = () => {
    setUserNombre('');
    setUserEmail('');
    setUserRol('user');
    setUserPassword('password123');
    setAssignToActiveAccount(Boolean(activeAccount));
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNombre.trim()) {
      toast('El nombre del usuario es obligatorio', 'error');
      return;
    }
    if (!userEmail.trim()) {
      toast('El correo electrónico es obligatorio', 'error');
      return;
    }

    try {
      setSavingUser(true);
      await api.auth.createUser({
        nombre: userNombre.trim(),
        email: userEmail.trim(),
        rol: userRol,
        password: userPassword || 'password123',
        assignToAccountId: assignToActiveAccount && activeAccount ? activeAccount.id : undefined,
      });

      await fetchUsers();
      await refreshAccounts();
      toast('Usuario creado exitosamente', 'success');
      setIsUserModalOpen(false);
    } catch (err: any) {
      toast(err.message || 'Error al crear usuario', 'error');
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUserTarget) return;
    try {
      await api.auth.deleteUser(deleteUserTarget.id);
      await fetchUsers();
      await refreshAccounts();
      toast('Usuario eliminado del sistema', 'success');
      setDeleteUserTarget(null);
    } catch (err: any) {
      toast(err.message || 'Error al eliminar usuario', 'error');
    }
  };

  const handleResetData = () => {
    if (window.confirm('¿Desea restaurar todos los datos originales de muestra (usuarios, feedlots, productos y pedidos)?')) {
      db.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
            Cuentas y equipo
          </h1>
          <p className="text-xs text-stone-500 mt-0.5 font-sans">
            Feedlots, clientes y establecimientos con su catálogo y membrete individual.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            title="Restaurar datos de prueba originales"
            icon={<RotateCcw className="w-3.5 h-3.5 text-stone-500" />}
          >
            Restaurar demo
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              size="md"
              onClick={openCreateUserModal}
              icon={<UserPlus className="w-4 h-4 text-[#1f4e38]" />}
            >
              Nuevo usuario
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Nueva cuenta
          </Button>
        </div>
      </div>

      {/* Role explanation alert */}
      <div className="bg-[#1f4e38]/5 border border-[#1f4e38]/15 rounded-xl p-4 flex items-start gap-3 text-xs text-stone-700">
        <Shield className="w-4 h-4 text-[#1f4e38] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#1f4e38]">
            {isAdmin ? 'Sesión de Administrador: ' : 'Sesión de Usuario: '}
          </span>
          {isAdmin ? (
            <span>
              Usted tiene rol <strong>admin</strong>. Puede visualizar y gestionar todas las cuentas
              del sistema, agregar nuevos usuarios y asignar miembros sin restricciones.
            </span>
          ) : (
            <span>
              Usted tiene rol <strong>user</strong>. Solo ve las cuentas donde figura como miembro
              (si no tiene ninguna asignada, ve todas).
            </span>
          )}
        </div>
      </div>

      {/* Accounts List Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-stone-500">
          Cuentas accesibles ({accounts.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(acc => {
            const isActive = activeAccount?.id === acc.id;

            return (
              <div
                key={acc.id}
                className={`p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between relative ${
                  isActive
                    ? 'bg-white border-[#1f4e38] shadow-md ring-1 ring-[#1f4e38]/20'
                    : 'bg-white/80 border-stone-200/90 hover:border-stone-300 hover:bg-white shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-serif text-sm font-bold text-stone-800 shadow-2xs">
                        {acc.iniciales}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-stone-900 leading-snug">
                          {acc.nombre}
                        </h3>
                        <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-stone-500">
                          {acc.tipo}
                        </span>
                      </div>
                    </div>

                    {isActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1f4e38]/10 text-[#1f4e38] font-mono shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Activa
                      </span>
                    )}
                  </div>

                  {acc.bajada && (
                    <p className="text-xs text-stone-600 line-clamp-2 mb-3 font-sans">
                      {acc.bajada}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-4 font-mono">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{acc.miembros?.length || 0} miembros asignados</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  {!isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveAccount(acc)}
                      className="text-xs"
                    >
                      Establecer como activa
                    </Button>
                  ) : (
                    <span className="text-xs font-mono text-[#1f4e38] font-medium">
                      Membrete en uso
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Editar cuenta"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isAdmin && accounts.length > 1 && (
                      <button
                        onClick={() => setDeleteAccountTarget(acc)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Management Section for the Active Account */}
      {activeAccount && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1f4e38]" />
                Equipo de trabajo: {activeAccount.nombre}
              </h2>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Usuarios con permisos para operar en esta cuenta. Haga clic sobre un usuario para vincularlo o desvincularlo.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-stone-500">
                {activeAccount.miembros?.length || 0} asignados
              </span>
              {isAdmin && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={openCreateUserModal}
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Nuevo usuario
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allUsers.map(u => {
              const isAssigned = activeAccount.miembros?.includes(u.id);
              const isCurrentUser = user?.id === u.id;

              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleMember(u.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative ${
                    isAssigned
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs hover:border-emerald-400'
                      : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
                  }`}
                  title={isAssigned ? 'Haga clic para desvincular de la cuenta' : 'Haga clic para vincular a la cuenta'}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isAssigned
                          ? 'bg-[#1f4e38] text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {u.nombre ? u.nombre[0].toUpperCase() : 'U'}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-stone-900 truncate">
                        {u.nombre} {isCurrentUser && <span className="text-[10px] text-stone-400 font-normal">(tú)</span>}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono truncate">{u.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            u.rol === 'admin'
                              ? 'bg-amber-100 text-amber-800 font-semibold'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          Rol: {u.rol}
                        </span>
                        {isAssigned && (
                          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100/70 px-1 py-0.2 rounded font-medium">
                            Miembro
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && !isCurrentUser && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteUserTarget(u);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Eliminar usuario del sistema"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                        isAssigned
                          ? 'bg-[#1f4e38] border-[#1f4e38] text-white'
                          : 'border-stone-300 bg-white text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Account Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}
        description="Configure los datos que se imprimirán en el membrete oficial de las órdenes de compra."
      >
        <form onSubmit={handleSaveAccount} className="space-y-4">
          <Input
            label="Nombre de la cuenta o establecimiento"
            placeholder="Ej: Feedlot Las Acacias, Veterinaria San Roque..."
            value={nombre}
            onChange={e => handleNameChange(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Tipo de establecimiento"
              value={tipo}
              onChange={e => setTipo(e.target.value as AccountType)}
            >
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            <Input
              label="Iniciales para membrete"
              placeholder="Ej: FLA"
              maxLength={4}
              value={iniciales}
              onChange={e => setIniciales(e.target.value.toUpperCase())}
              helperText="Se imprimen en el recuadro superior"
              required
            />
          </div>

          <Input
            label="Bajada / Subtítulo para la planilla"
            placeholder="Ej: Establecimiento Ganadero y Engorde a Corral • Ruta 5 Km 142"
            value={bajada}
            onChange={e => setBajada(e.target.value)}
            helperText="Texto secundario impreso bajo el nombre"
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="acc-activo"
              checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="w-4 h-4 text-[#1f4e38] rounded border-stone-300 focus:ring-[#1f4e38]"
            />
            <label htmlFor="acc-activo" className="text-xs font-medium text-stone-700 cursor-pointer">
              Cuenta activa
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              {editingAccount ? 'Actualizar cuenta' : 'Crear cuenta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal (Admin only) */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Nuevo usuario del sistema"
        description="Agregue un veterinario o miembro de equipo con acceso a VetOrder Pro."
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <Input
            label="Nombre y Apellido / Matrícula"
            placeholder="Ej: Dra. Sofía Martínez, Dr. Esteban Paz..."
            value={userNombre}
            onChange={e => setUserNombre(e.target.value)}
            required
          />

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="sofia.martinez@vetorder.pro"
            value={userEmail}
            onChange={e => setUserEmail(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Rol en el sistema"
              value={userRol}
              onChange={e => setUserRol(e.target.value as UserRole)}
            >
              <option value="user">Usuario (Operador)</option>
              <option value="admin">Administrador (Total)</option>
            </Select>

            <Input
              label="Contraseña inicial"
              type="text"
              placeholder="Mínimo 6 caracteres"
              value={userPassword}
              onChange={e => setUserPassword(e.target.value)}
              helperText="Podrá cambiarla al iniciar sesión"
              required
            />
          </div>

          {activeAccount && (
            <div className="flex items-center gap-2.5 pt-1 bg-stone-50 p-3 rounded-xl border border-stone-200/80">
              <input
                type="checkbox"
                id="assign-account"
                checked={assignToActiveAccount}
                onChange={e => setAssignToActiveAccount(e.target.checked)}
                className="w-4 h-4 text-[#1f4e38] rounded border-stone-300 focus:ring-[#1f4e38]"
              />
              <label htmlFor="assign-account" className="text-xs font-medium text-stone-700 cursor-pointer">
                Asignar automáticamente a la cuenta activa (<strong>{activeAccount.nombre}</strong>)
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUserModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={savingUser}>
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete User Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteUserTarget)}
        onClose={() => setDeleteUserTarget(null)}
        onConfirm={handleDeleteUser}
        title="Eliminar usuario"
        message={`¿Está seguro de que desea eliminar al usuario "${deleteUserTarget?.nombre}" (${deleteUserTarget?.email}) del sistema? Se desvinculará de todas las cuentas.`}
        confirmLabel="Eliminar usuario"
        isTwoStep={true}
      />

      {/* Delete Account Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteAccountTarget)}
        onClose={() => setDeleteAccountTarget(null)}
        onConfirm={handleDeleteAccount}
        title="Eliminar cuenta"
        message={`¿Está seguro de que desea eliminar la cuenta "${deleteAccountTarget?.nombre}"?`}
        confirmLabel="Eliminar cuenta"
        isTwoStep={true}
      />
    </div>
  );
};
