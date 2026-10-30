import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  AlertCircle,
  Package,
  Layers,
  Info,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { api } from '../../services/api';
import type { OrderItem, Product, ProductUnit, Supplier } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/feedback/Toast';
import { formatUnitNatural, getLaboratoryBadgeStyle } from '../../utils/formatters';

export const OrderFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const { activeAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form State
  const [fecha, setFecha] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [laboratorio, setLaboratorio] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Catalog & Suppliers State
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [registeredSuppliers, setRegisteredSuppliers] = useState<Supplier[]>([]);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Free item dialog state
  const [freeItemModalOpen, setFreeItemModalOpen] = useState<boolean>(false);
  const [freeNombre, setFreeNombre] = useState<string>('');
  const [freePresentacion, setFreePresentacion] = useState<string>('');
  const [freeUnidad, setFreeUnidad] = useState<ProductUnit>('unidad');
  const [freeCantidad, setFreeCantidad] = useState<number>(1);

  // Load account catalog and existing order if editing
  useEffect(() => {
    const loadData = async () => {
      if (!activeAccount) {
        setLoadingInitial(false);
        return;
      }

      try {
        setLoadingInitial(true);
        const [products, suppliersList] = await Promise.all([
          api.products.getByAccount(activeAccount.id, { activoOnly: true }),
          api.suppliers.getByAccount(activeAccount.id),
        ]);
        setCatalog(products);
        setRegisteredSuppliers(suppliersList);

        if (isEditing && id) {
          const existing = await api.orders.getById(id);
          if (existing) {
            const fallbackToday = new Date().toISOString().split('T')[0];
            setFecha(existing.fecha || fallbackToday);
            setLaboratorio(existing.laboratorio || '');
            setObservaciones(existing.observaciones || '');
            setItems(existing.items || []);
          } else {
            toast('No se encontró la orden solicitada', 'error');
          }
        }
      } catch (err: any) {
        toast(err.message || 'Error cargando datos', 'error');
      } finally {
        setLoadingInitial(false);
      }
    };

    loadData();
  }, [activeAccount, id, isEditing, toast]);

  // Extract distinct laboratories present in registered suppliers or active catalog
  const availableLaboratories = useMemo(() => {
    const labs = new Set<string>();
    registeredSuppliers.forEach(s => {
      if (s.nombre && s.nombre.trim()) {
        labs.add(s.nombre.trim());
      }
    });
    catalog.forEach(p => {
      if (p.laboratorio && p.laboratorio.trim()) {
        labs.add(p.laboratorio.trim());
      }
    });
    return Array.from(labs).sort();
  }, [registeredSuppliers, catalog]);

  // Filter catalog products for adding: filtered by selected laboratory and search query
  const filteredCatalog = useMemo(() => {
    let list = catalog;
    if (laboratorio && laboratorio.trim()) {
      list = list.filter(
        p => p.laboratorio.toLowerCase() === laboratorio.toLowerCase().trim()
      );
    }
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      list = list.filter(
        p =>
          p.nombre.toLowerCase().includes(q) ||
          p.presentacion.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      );
    }
    return list;
  }, [catalog, laboratorio, catalogSearch]);

  // Handle Lab change: "Al cambiar de laboratorio se descartan los ítems que no pertenecen a ese proveedor"
  const handleLaboratoryChange = (newLab: string) => {
    if (newLab === laboratorio) return;

    if (newLab && items.length > 0) {
      const incompatibleCount = items.filter(
        i => i.laboratorio && i.laboratorio.toLowerCase() !== newLab.toLowerCase()
      ).length;

      if (incompatibleCount > 0) {
        const confirmDiscard = window.confirm(
          `Al seleccionar "${newLab}" se descartarán ${incompatibleCount} ítem(s) que pertenecen a otro proveedor. ¿Desea continuar?`
        );
        if (!confirmDiscard) return;
      }
    }

    setLaboratorio(newLab);

    if (newLab) {
      // Discard items not belonging to that provider
      setItems(prev =>
        prev.filter(
          item =>
            !item.laboratorio ||
            item.laboratorio.toLowerCase() === newLab.toLowerCase()
        )
      );
    }
  };

  // Add Product from Catalog
  const handleAddProduct = (product: Product) => {
    setItems(prev => {
      const existingIdx = prev.findIndex(i => i.producto_id === product.id);
      if (existingIdx >= 0) {
        // If already in order, add "paso"
        const updated = [...prev];
        const current = updated[existingIdx];
        const step = current.paso || 1;
        updated[existingIdx] = {
          ...current,
          cantidad: current.cantidad + step,
        };
        toast(`Se sumó +${step} a ${product.nombre}`, 'info');
        return updated;
      }

      // Add new item with initial quantity = minimo (or 1)
      const newItem: OrderItem = {
        producto_id: product.id,
        nombre: product.nombre,
        presentacion: product.presentacion,
        unidad: product.unidad,
        cantidad: Math.max(1, product.minimo || 1),
        minimo: product.minimo || 1,
        paso: product.paso || 1,
        laboratorio: product.laboratorio,
      };
      toast(`Agregado al pedido: ${product.nombre}`, 'success');
      return [...prev, newItem];
    });
  };

  // Adjust item quantity with stepper
  const handleStepQuantity = (index: number, direction: 'up' | 'down') => {
    setItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const step = item.paso || 1;
      const min = item.minimo || 1;

      if (direction === 'up') {
        item.cantidad += step;
      } else {
        item.cantidad = Math.max(min, item.cantidad - step);
      }
      return updated;
    });
  };

  // Manual quantity input change
  const handleQuantityInput = (index: number, rawVal: string) => {
    const val = parseInt(rawVal, 10);
    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        cantidad: isNaN(val) ? 0 : val,
      };
      return updated;
    });
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Add Free Item (out of catalog)
  const handleAddFreeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeNombre.trim()) {
      toast('Ingrese el nombre del insumo', 'error');
      return;
    }
    if (freeCantidad <= 0) {
      toast('La cantidad debe ser mayor a 0', 'error');
      return;
    }

    const freeItem: OrderItem = {
      producto_id: null,
      nombre: freeNombre.trim(),
      presentacion: freePresentacion.trim(),
      unidad: freeUnidad,
      cantidad: freeCantidad,
      minimo: 1,
      paso: 1,
      laboratorio: laboratorio || 'Fuera de catálogo',
    };

    setItems(prev => [...prev, freeItem]);
    setFreeNombre('');
    setFreePresentacion('');
    setFreeCantidad(1);
    setFreeItemModalOpen(false);
    toast('Ítem libre agregado al pedido', 'success');
  };

  // Save Order
  const handleSaveOrder = async () => {
    setErrorMsg(null);

    // Validation 1: Check account
    if (!activeAccount) {
      setErrorMsg('No hay una cuenta activa seleccionada.');
      return;
    }

    // Validation 2: At least 1 item
    if (items.length === 0) {
      setErrorMsg('Debe agregar al menos un insumo a la orden de compra.');
      return;
    }

    // Validation 3: Check all quantities > 0
    const invalidItem = items.find(i => !i.cantidad || i.cantidad <= 0);
    if (invalidItem) {
      setErrorMsg(`El ítem "${invalidItem.nombre}" tiene una cantidad inválida.`);
      return;
    }

    try {
      setSaving(true);
      if (isEditing && id) {
        await api.orders.update(id, {
          fecha,
          laboratorio,
          observaciones,
          items,
        });
        toast('Orden de compra actualizada con éxito', 'success');
        navigate(`/pedido/${id}`);
      } else {
        const created = await api.orders.create({
          cuenta_id: activeAccount.id,
          fecha,
          laboratorio,
          observaciones,
          items,
        });
        toast('Orden de compra creada exitosamente', 'success');
        navigate(`/pedido/${created.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la orden.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="max-w-5xl mx-auto p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#1f4e38]/20 border-t-[#1f4e38] rounded-full animate-spin" />
          <span className="text-xs uppercase font-mono tracking-widest text-stone-500">
            Cargando editor de orden...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isEditing && id ? navigate(`/pedido/${id}`) : navigate('/'))}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Volver
          </Button>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
              {isEditing ? 'Editar orden de compra' : 'Nueva orden de compra'}
            </h1>
            <p className="text-xs text-stone-500 font-sans">
              Cuenta:{' '}
              <span className="font-semibold text-stone-800">
                {activeAccount?.nombre || 'Sin cuenta'}
              </span>
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSaveOrder}
          loading={saving}
          icon={<Save className="w-4 h-4" />}
        >
          {isEditing ? 'Guardar cambios' : 'Generar orden'}
        </Button>
      </div>

      {/* Inline Validation Error Alert */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-800 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Main Settings Card */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Laboratory Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
              Laboratorio Proveedor
            </label>
            <select
              value={laboratorio}
              onChange={e => handleLaboratoryChange(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 focus:border-[#1f4e38] transition-all cursor-pointer font-medium"
            >
              <option value="">Sin laboratorio (Pedido general)</option>
              {availableLaboratories.map(lab => (
                <option key={lab} value={lab}>
                  {lab}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-stone-400 shrink-0" />
              Filtra el catálogo por este laboratorio. Al cambiar, se descartan ítems de otros
              proveedores.
            </p>
          </div>

          {/* Date Picker (Default = Today) */}
          <div>
            <Input
              type="date"
              label="Fecha de la orden"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Fecha que figurará en el membrete impreso.
            </p>
          </div>
        </div>

        {/* Optional Observations */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
            Observaciones o Instrucciones de entrega (Opcional)
          </label>
          <input
            type="text"
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Ej: Entregar antes de las 14hs con cadena de frío..."
            className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 focus:border-[#1f4e38] transition-all"
          />
        </div>
      </div>

      {/* Main Two-Column Layout: Catalog Explorer & Order Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Catalog Search & Quick Add (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#1f4e38]" />
              Catálogo disponible
            </h3>
            <span className="text-[11px] font-mono text-stone-500">
              {filteredCatalog.length} productos
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={catalogSearch}
              onChange={e => setCatalogSearch(e.target.value)}
              placeholder="Buscar por nombre o presentación..."
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30"
            />
          </div>

          {/* Products List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredCatalog.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <p>No se encontraron insumos con este filtro.</p>
                {laboratorio && (
                  <p className="mt-1 text-[11px] text-stone-400">
                    Laboratorio: <strong>{laboratorio}</strong>
                  </p>
                )}
              </div>
            ) : (
              filteredCatalog.map(prod => {
                const badgeStyle = getLaboratoryBadgeStyle(prod.laboratorio);
                const isAlreadyAdded = items.some(i => i.producto_id === prod.id);

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className="p-2.5 rounded-xl border border-stone-200/80 hover:border-[#1f4e38]/60 hover:bg-[#1f4e38]/5 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-stone-900 group-hover:text-[#1f4e38] transition-colors truncate">
                          {prod.nombre}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full border font-mono ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          {prod.laboratorio}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 truncate">
                        {prod.presentacion} • Mín: {prod.minimo} {prod.unidad} • Paso: +{prod.paso}
                      </p>
                    </div>

                    <button
                      type="button"
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-[#1f4e38] text-white shadow-2xs'
                          : 'bg-stone-100 group-hover:bg-[#1f4e38] group-hover:text-white text-stone-600'
                      }`}
                      title={isAlreadyAdded ? `Sumar +${prod.paso}` : 'Agregar al pedido'}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Action to add Free item out of catalog */}
          <div className="pt-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFreeItemModalOpen(true)}
              className="w-full text-xs"
              icon={<Plus className="w-3.5 h-3.5 text-stone-600" />}
            >
              + Agregar ítem libre (fuera de catálogo)
            </Button>
          </div>
        </div>

        {/* Right Column: Order Items Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1f4e38]" />
                Insumos en la orden
              </h3>
              <p className="text-xs text-stone-500 font-sans">
                {items.length === 1 ? '1 insumo agregado' : `${items.length} insumos agregados`}
              </p>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={() => setItems([])}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-mono underline cursor-pointer"
              >
                Vaciar lista
              </button>
            )}
          </div>

          {/* Items Container */}
          {items.length === 0 ? (
            <div className="py-16 text-center text-stone-400 border border-dashed border-stone-200 rounded-xl space-y-2">
              <Package className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs text-stone-600 font-medium">Aún no hay insumos en el pedido</p>
              <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                Selecciona productos del catálogo a la izquierda o suma un ítem libre.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {items.map((item, idx) => {
                const isBelowMin = item.minimo && item.cantidad < item.minimo;

                return (
                  <div
                    key={`${item.nombre}-${idx}`}
                    className="p-3 bg-stone-50/70 border border-stone-200 rounded-xl flex items-center justify-between gap-3"
                  >
                    {/* Index & Name */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-md bg-stone-200 text-stone-700 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-stone-900 truncate">
                          {item.nombre}
                        </p>
                        <p className="text-[11px] text-stone-500 truncate">
                          {item.presentacion ? item.presentacion : 'Sin presentación'} •{' '}
                          <span className="font-mono text-stone-600">
                            {formatUnitNatural(item.cantidad, item.unidad)}
                          </span>
                        </p>
                        {isBelowMin && (
                          <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                            ⚠️ Mínimo requerido: {item.minimo} {item.unidad}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stepper & Counter */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStepQuantity(idx, 'down')}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 cursor-pointer transition-colors"
                        title={`Restar -${item.paso || 1}`}
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min={item.minimo || 1}
                        step={item.paso || 1}
                        value={item.cantidad}
                        onChange={e => handleQuantityInput(idx, e.target.value)}
                        className="w-14 text-center py-1 bg-white border border-stone-300 rounded-lg text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#1f4e38]"
                      />

                      <button
                        type="button"
                        onClick={() => handleStepQuantity(idx, 'up')}
                        className="w-7 h-7 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center text-xs font-bold text-stone-700 cursor-pointer transition-colors"
                        title={`Sumar +${item.paso || 1}`}
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="w-7 h-7 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors ml-1 cursor-pointer"
                        title="Quitar insumo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table summary note */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-mono">
            <span>
              Planilla A4: {Math.max(1, Math.ceil(items.length / 17))}{' '}
              {Math.max(1, Math.ceil(items.length / 17)) === 1 ? 'página' : 'páginas'} (17 filas/hoja)
            </span>
            <span className="font-semibold text-stone-800">
              Total renglones: {items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Free Item Modal Dialog */}
      <Modal
        isOpen={freeItemModalOpen}
        onClose={() => setFreeItemModalOpen(false)}
        title="Agregar ítem libre"
        description="Insumo no listado en el catálogo oficial para esta orden."
      >
        <form onSubmit={handleAddFreeItem} className="space-y-4">
          <Input
            label="Nombre del insumo / medicamento"
            placeholder="Ej: Curabicheras en pasta, Guantes de palpación..."
            value={freeNombre}
            onChange={e => setFreeNombre(e.target.value)}
            required
          />

          <Input
            label="Presentación (opcional)"
            placeholder="Ej: pote 500 gr, caja x 50..."
            value={freePresentacion}
            onChange={e => setFreePresentacion(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Unidad"
              value={freeUnidad}
              onChange={e => setFreeUnidad(e.target.value as ProductUnit)}
            >
              <option value="Frasco">Frasco</option>
              <option value="Bidón">Bidón</option>
              <option value="Balde">Balde</option>
              <option value="Bolsa">Bolsa</option>
              <option value="Caja">Caja</option>
              <option value="Pomo">Pomo</option>
              <option value="Unidad">Unidad</option>
              <option value="dosis">Dosis</option>
            </Select>

            <Input
              type="number"
              min={1}
              label="Cantidad inicial"
              value={freeCantidad}
              onChange={e => setFreeCantidad(parseInt(e.target.value, 10) || 1)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFreeItemModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Agregar al pedido
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
