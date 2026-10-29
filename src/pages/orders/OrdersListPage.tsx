import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  ClipboardList,
  Building2,
  Calendar,
  Layers,
  FlaskConical,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { api } from '../../services/api';
import type { Order, OrderMetrics } from '../../types';
import { formatDate, getLaboratoryBadgeStyle } from '../../utils/formatters';
import { Button } from '../../components/ui/Button';

export const OrdersListPage: React.FC = () => {
  const { activeAccount, accounts, loading: accountsLoading } = useAccount();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrdersAndMetrics = useCallback(async () => {
    if (!activeAccount) {
      setOrders([]);
      setMetrics(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Both server calls run concurrently
      const [metricsRes, ordersRes] = await Promise.all([
        api.orders.getMetrics(activeAccount.id),
        api.orders.getByAccount(activeAccount.id, { limit: 50, page: 1 }),
      ]);
      setMetrics(metricsRes);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [activeAccount]);

  useEffect(() => {
    fetchOrdersAndMetrics();
  }, [fetchOrdersAndMetrics]);

  // STATE 1: No accounts exist in the system or accessible
  if (!accountsLoading && accounts.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-amber-900 mb-2">
            Falta crear o asignar una cuenta
          </h2>
          <p className="text-sm text-amber-800 max-w-md mx-auto mb-6">
            Para gestionar pedidos y catálogos, primero debe crear al menos una cuenta (Feedlot,
            Veterinaria o Cliente).
          </p>
          <Button
            onClick={() => navigate('/cuentas')}
            icon={<Plus className="w-4 h-4" />}
          >
            Ir a Cuentas y Crear la Primera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-200">
      {/* Active Account Membrete Banner */}
      {activeAccount && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-xl border-2 border-[#1f4e38] flex items-center justify-center bg-[#1f4e38]/5 font-serif text-2xl font-bold text-[#1f4e38] tracking-wider shrink-0 shadow-xs">
              {activeAccount.iniciales || 'VO'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-[#14261c] tracking-tight">
                  {activeAccount.nombre}
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200">
                  {activeAccount.tipo}
                </span>
              </div>
              {activeAccount.bajada && (
                <p className="text-xs uppercase tracking-wider text-stone-500 mt-0.5 font-sans">
                  {activeAccount.bajada}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/pedido/nuevo')}
              icon={<Plus className="w-4 h-4" />}
            >
              Nuevo pedido
            </Button>
          </div>
        </div>
      )}

      {/* Screen Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200 pb-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Órdenes de compra
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro cronológico de pedidos cargados para {activeAccount?.nombre || 'la cuenta'}.
          </p>
        </div>
        <span className="text-xs font-mono text-stone-400">
          Mostrando los 50 pedidos más recientes
        </span>
      </div>

      {/* 3 Metric Cards (Calculated on Server) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
              Total de pedidos
            </p>
            {loading ? (
              <div className="h-8 w-16 bg-stone-100 animate-pulse rounded mt-1" />
            ) : (
              <h3 className="font-mono text-2xl font-bold text-stone-900 mt-1">
                {metrics?.totalPedidos ?? 0}
              </h3>
            )}
            <p className="text-[10px] text-stone-400 mt-1">Histórico de la cuenta</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-[#1f4e38] flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
              Pedidos este mes
            </p>
            {loading ? (
              <div className="h-8 w-16 bg-stone-100 animate-pulse rounded mt-1" />
            ) : (
              <h3 className="font-mono text-2xl font-bold text-[#1f4e38] mt-1">
                {metrics?.pedidosMesActual ?? 0}
              </h3>
            )}
            <p className="text-[10px] text-stone-400 mt-1">Mes en curso</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-5 border border-stone-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-stone-500">
              Laboratorios usados
            </p>
            {loading ? (
              <div className="h-8 w-16 bg-stone-100 animate-pulse rounded mt-1" />
            ) : (
              <h3 className="font-mono text-2xl font-bold text-stone-900 mt-1">
                {metrics?.laboratoriosDistintos ?? 0}
              </h3>
            )}
            <p className="text-[10px] text-stone-400 mt-1">Proveedores distintos</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Orders List Section */}
      <div className="space-y-3">
        {loading ? (
          // Loading Skeleton
          <div className="space-y-3">
            {[1, 2, 3, 4].map(n => (
              <div
                key={n}
                className="bg-white rounded-xl p-5 border border-stone-200 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-24 bg-stone-200 rounded" />
                    <div className="h-5 w-20 bg-stone-100 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-stone-100 rounded" />
                </div>
                <div className="h-9 w-28 bg-stone-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl p-10 border border-dashed border-stone-300 text-center shadow-2xs">
            <div className="w-16 h-16 rounded-full bg-[#1f4e38]/5 border border-[#1f4e38]/10 text-[#1f4e38] flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 opacity-80" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-800 mb-1">
              No hay órdenes de compra registradas
            </h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto mb-6">
              Esta cuenta aún no posee órdenes. Comienza seleccionando un laboratorio y sumando
              insumos desde el catálogo.
            </p>
            <Button
              onClick={() => navigate('/pedido/nuevo')}
              icon={<Plus className="w-4 h-4" />}
            >
              Crear primera orden de compra
            </Button>
          </div>
        ) : (
          // Orders Cards List
          <div className="grid grid-cols-1 gap-3">
            {orders.map(order => {
              const labStyle = getLaboratoryBadgeStyle(order.laboratorio);
              const itemsList = order.items || [];
              const itemsSummary = itemsList.map(i => i.nombre).join(', ');

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/pedido/${order.id}`)}
                  className="bg-white rounded-xl p-4 md:p-5 border border-stone-200/90 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                >
                  {/* Left Column: Number, Lab, Date, Items Preview */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200">
                        {order.numero}
                      </span>

                      {/* Laboratory Tag */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${labStyle.bg} ${labStyle.text} ${labStyle.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${labStyle.dot}`} />
                        {order.laboratorio ? order.laboratorio : 'Pedido General'}
                      </span>

                      {/* Date */}
                      <span className="text-xs text-stone-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {formatDate(order.fecha, 'short')}
                      </span>

                      {/* Item count */}
                      <span className="text-[11px] text-stone-500 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Layers className="w-3 h-3 text-stone-400" />
                        {itemsList.length} {itemsList.length === 1 ? 'ítem' : 'ítems'}
                      </span>
                    </div>

                    {/* First line of items preview */}
                    <p className="text-xs text-stone-600 truncate font-sans">
                      <span className="font-medium text-stone-700">Insumos: </span>
                      {itemsSummary || 'Sin insumos cargados'}
                    </p>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/pedido/${order.id}`);
                      }}
                      icon={<Printer className="w-3.5 h-3.5 text-stone-500" />}
                    >
                      Planilla
                    </Button>
                    <div className="w-8 h-8 rounded-lg bg-stone-100 group-hover:bg-[#1f4e38] group-hover:text-white transition-colors flex items-center justify-center text-stone-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
