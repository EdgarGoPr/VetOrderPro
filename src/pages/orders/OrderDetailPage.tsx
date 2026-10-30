import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Printer,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  Layers,
  FileQuestion,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccount } from '../../context/AccountContext';
import type { Account, Order } from '../../types';
import { formatDate, getLaboratoryBadgeStyle } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PrintableOrderSheet } from '../../components/print/PrintableOrderSheet';
import { useToast } from '../../components/feedback/Toast';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeAccount, accounts } = useAccount();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [orderAccount, setOrderAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const orderData = await api.orders.getById(id);
      if (!orderData) {
        setNotFound(true);
        return;
      }
      setOrder(orderData);

      // Find the account for this order
      let acc: Account | null = accounts.find(a => a.id === orderData.cuenta_id) || null;
      if (!acc) {
        acc = await api.accounts.getById(orderData.cuenta_id);
      }
      setOrderAccount(acc || activeAccount);
    } catch (err: any) {
      if (err.statusCode === 404 || err.message?.includes('404') || err.message?.includes('No encontramos')) {
        setNotFound(true);
      } else {
        toast(err.message || 'Error al cargar pedido', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, accounts, activeAccount, toast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await api.orders.delete(id);
      toast('Orden de compra eliminada correctamente', 'success');
      navigate('/');
    } catch (err: any) {
      toast(err.message || 'Error al eliminar orden', 'error');
    }
  };

  // 404 Not Found State
  if (notFound) {
    return (
      <div className="max-w-xl mx-auto p-8 my-12 text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div className="inline-block px-2.5 py-1 bg-stone-100 rounded-md font-mono text-xs text-stone-600 mb-2">
          HTTP 404 — Not Found
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 mb-2">
          No encontramos este pedido
        </h1>
        <p className="text-xs text-stone-600 max-w-sm mx-auto mb-6">
          La orden de compra solicitada no existe, fue eliminada o no pertenece a las cuentas
          habilitadas para su usuario.
        </p>
        <Button onClick={() => navigate('/')} icon={<ArrowLeft className="w-4 h-4" />}>
          Volver al listado de órdenes
        </Button>
      </div>
    );
  }

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
        <div className="h-8 w-48 bg-stone-200 rounded animate-pulse" />
        <div className="h-40 bg-white rounded-2xl border border-stone-200 animate-pulse" />
        <div className="h-96 bg-white rounded-2xl border border-stone-200 animate-pulse" />
      </div>
    );
  }

  if (!order || !orderAccount) return null;

  const labStyle = getLaboratoryBadgeStyle(order.laboratorio);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Action Toolbar (hidden during print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Órdenes
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Orden de compra {order.numero}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${labStyle.bg} ${labStyle.text} ${labStyle.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${labStyle.dot}`} />
                {order.laboratorio || 'Pedido General'}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-sans mt-0.5">
              Cuenta: <span className="font-semibold text-stone-800">{orderAccount.nombre}</span> •{' '}
              {orderAccount.tipo}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="primary"
            size="md"
            onClick={handlePrint}
            icon={<Printer className="w-4 h-4" />}
          >
            Imprimir planilla
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => navigate(`/pedido/editar/${order.id}`)}
            icon={<Edit className="w-4 h-4" />}
          >
            Editar
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 hover:border-rose-300"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* Quick Summary Pill Bar (hidden during print) */}
      <div className="no-print bg-white rounded-xl p-4 border border-stone-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-stone-400" />
            <span className="text-stone-500 font-sans">Fecha de emisión:</span>
            <span className="font-mono font-bold text-stone-800">
              {formatDate(order.fecha, 'long')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-stone-400" />
            <span className="text-stone-500 font-sans">Cantidad de insumos:</span>
            <span className="font-mono font-bold text-stone-800">
              {order.items.length} {order.items.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-500 text-[11px] font-mono">
          <span>Membrete: [{orderAccount.iniciales}]</span>
          <span>•</span>
          <span>Formato A4 Editorial</span>
        </div>
      </div>

      {/* The Printable Sheet Preview (visible on screen and in print) */}
      <div className="printable-preview-area">
        <div className="no-print text-center mb-2">
          <span className="text-[11px] uppercase tracking-widest font-mono text-stone-400">
            Vista previa exacta de impresión (Hoja A4)
          </span>
        </div>

        <PrintableOrderSheet order={order} account={orderAccount} />
      </div>

      {/* Two-step Confirm Deletion Modal */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar orden de compra"
        message={`¿Está seguro de que desea eliminar la orden ${order.numero} de ${orderAccount.nombre}?`}
        confirmLabel="Eliminar orden"
        isTwoStep={true}
      />
    </div>
  );
};
