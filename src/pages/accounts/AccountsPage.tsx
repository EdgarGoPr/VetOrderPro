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
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { db } from '../../services/db';
import type { Account, AccountType, User } from '../../types';
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState<string>('');
  const [tipo, setTipo] = useState<AccountType>('Feedlot');
  const [iniciales, setIniciales] = useState<string>('');
  const [bajada, setBajada] = useState<string>('');
  const [activo, setActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete State
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<Account | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersList = await api.auth.getAllUsers();
        setAllUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetData}
            title="Restaurar datos de prueba originales"
            icon={<RotateCcw className="w-3.5 h-3.5 text-stone-500" />}
          >
            Restaurar demo
          </Button>
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
              del sistema y asignar miembros sin restricciones.
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
            const memberCount = acc.miembros?.length || 0;

            return (
              <div
                key={acc.id}
                className={`bg-white rounded-2xl p-5 border transition-all duration-150 flex flex-col justify-between ${
                  isActive
                    ? 'border-[#1f4e38] ring-2 ring-[#1f4e38]/15 shadow-sm'
                    : 'border-stone-200/90 shadow-2xs hover:border-stone-300'
                }`}
              >
                <div>
                  {/* Top Bar with Initials and Active Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-xl border-2 border-stone-800 flex items-center justify-center font-serif text-lg font-bold text-stone-900 bg-stone-50 shadow-xs">
                      {acc.iniciales}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold bg-[#1f4e38] text-white px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Activa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveAccount(acc)}
                          className="text-[11px] font-mono text-stone-600 hover:text-[#1f4e38] bg-stone-100 hover:bg-[#1f4e38]/10 px-2.5 py-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          Seleccionar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Account Name & Type */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                        {acc.nombre}
                      </h3>
                    </div>
                    <span className="inline-block text-[10px] font-mono uppercase tracking-wider text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                      {acc.tipo}
                    </span>
                    {acc.bajada && (
                      <p className="text-xs text-stone-500 pt-1 line-clamp-2">
                        {acc.bajada}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Metadata & Actions */}
                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Editar cuenta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDeleteAccountTarget(acc)}
                        className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h2 className="font-serif font-bold text-xl text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1f4e38]" />
                Equipo de trabajo: {activeAccount.nombre}
              </h2>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Usuarios con permisos para emitir pedidos y gestionar el catálogo de esta cuenta.
              </p>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {activeAccount.miembros?.length || 0} asignados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allUsers.map(u => {
              const isAssigned = activeAccount.miembros?.includes(u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => handleToggleMember(u.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isAssigned
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                      : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
                  }`}
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
                        {u.nombre}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono truncate">{u.email}</p>
                      <span
                        className={`inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded mt-0.5 ${
                          u.rol === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        Rol: {u.rol}
                      </span>
                    </div>
                  </div>

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
