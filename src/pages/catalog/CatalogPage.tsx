import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { api } from '../../services/api';
import type { Product, ProductCategory, ProductUnit } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/feedback/Toast';
import { getLaboratoryBadgeStyle } from '../../utils/formatters';

const CATEGORIES: ProductCategory[] = [
  'Vacunas',
  'Antibióticos',
  'Antiinflamatorios',
  'Insumos',
  'Antiparasitarios',
  'Otros',
];

export const CatalogPage: React.FC = () => {
  const { activeAccount } = useAccount();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedLab, setSelectedLab] = useState<string>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Product Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [nombre, setNombre] = useState<string>('');
  const [laboratorio, setLaboratorio] = useState<string>('');
  const [categoria, setCategoria] = useState<ProductCategory>('Vacunas');
  const [presentacion, setPresentacion] = useState<string>('');
  const [unidad, setUnidad] = useState<ProductUnit>('unidad');
  const [minimo, setMinimo] = useState<number>(1);
  const [paso, setPaso] = useState<number>(1);
  const [activo, setActivo] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Delete Dialog State
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!activeAccount) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.products.getByAccount(activeAccount.id);
      setProducts(data);
    } catch (err: any) {
      toast(err.message || 'Error al cargar catálogo', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeAccount, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract distinct laboratories from products
  const availableLabs = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.laboratorio && p.laboratorio.trim()) {
        set.add(p.laboratorio.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Lab filter
      if (selectedLab !== 'Todos' && p.laboratorio.toLowerCase() !== selectedLab.toLowerCase()) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'Todas' && p.categoria !== selectedCategory) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        return (
          p.nombre.toLowerCase().includes(q) ||
          p.laboratorio.toLowerCase().includes(q) ||
          p.presentacion.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, selectedLab, selectedCategory, search]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setNombre('');
    setLaboratorio(availableLabs[0] || 'Biogénesis Bagó');
    setCategoria('Vacunas');
    setPresentacion('');
    setUnidad('unidad');
    setMinimo(1);
    setPaso(1);
    setActivo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setNombre(prod.nombre);
    setLaboratorio(prod.laboratorio);
    setCategoria(prod.categoria);
    setPresentacion(prod.presentacion);
    setUnidad(prod.unidad);
    setMinimo(prod.minimo);
    setPaso(prod.paso);
    setActivo(prod.activo);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) {
      toast('Debe seleccionar una cuenta activa', 'error');
      return;
    }
    if (!nombre.trim() || !laboratorio.trim()) {
      toast('Nombre y laboratorio son obligatorios', 'error');
      return;
    }

    try {
      setSaving(true);
      if (editingProduct) {
        await api.products.update(editingProduct.id, {
          nombre: nombre.trim(),
          laboratorio: laboratorio.trim(),
          categoria,
          presentacion: presentacion.trim(),
          unidad,
          minimo: Math.max(1, minimo),
          paso: Math.max(1, paso),
          activo,
        });
        toast('Insumo actualizado con éxito', 'success');
      } else {
        await api.products.create({
          cuenta_id: activeAccount.id,
          nombre: nombre.trim(),
          laboratorio: laboratorio.trim(),
          categoria,
          presentacion: presentacion.trim(),
          unidad,
          minimo: Math.max(1, minimo),
          paso: Math.max(1, paso),
          activo,
        });
        toast('Insumo incorporado al catálogo', 'success');
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      toast(err.message || 'Error al guardar insumo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    try {
      await api.products.delete(deleteProductTarget.id);
      toast('Insumo eliminado del catálogo', 'success');
      setDeleteProductTarget(null);
      await fetchProducts();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar insumo', 'error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
              Catálogo de insumos
            </h1>
            <span className="text-xs font-mono bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full border border-stone-200">
              {products.length} {products.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 font-sans">
            Medicamentos, vacunas y artículos para órdenes de compra en{' '}
            <span className="font-semibold text-stone-800">{activeAccount?.nombre}</span>.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          icon={<Plus className="w-4 h-4" />}
        >
          Nuevo insumo
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, presentación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30"
            />
          </div>

          {/* Laboratory Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedLab}
              onChange={e => setSelectedLab(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 cursor-pointer"
            >
              <option value="Todos">Todos los laboratorios</option>
              {availableLabs.map(lab => (
                <option key={lab} value={lab}>
                  {lab}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 cursor-pointer"
            >
              <option value="Todas">Todas las categorías</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Display Table / Cards */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-10 space-y-3">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-stone-500 space-y-3">
            <div className="w-14 h-14 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-stone-800">
              {products.length === 0
                ? 'El catálogo de esta cuenta está vacío'
                : 'No se encontraron insumos con los filtros aplicados'}
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {products.length === 0
                ? 'Agregue su primer medicamento o vacuna para comenzar a emitir órdenes de compra.'
                : 'Pruebe borrando el texto de búsqueda o cambiando el laboratorio seleccionado.'}
            </p>
            {products.length === 0 && (
              <Button onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
                Cargar primer insumo
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Insumo / Medicamento</th>
                  <th className="py-3 px-4 font-semibold">Laboratorio</th>
                  <th className="py-3 px-4 font-semibold">Categoría</th>
                  <th className="py-3 px-4 font-semibold">Presentación</th>
                  <th className="py-3 px-4 font-semibold text-center">Mínimo / Paso</th>
                  <th className="py-3 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map(prod => {
                  const badgeStyle = getLaboratoryBadgeStyle(prod.laboratorio);
                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-stone-50/70 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        {prod.nombre}
                      </td>

                      {/* Laboratory Pill */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                          {prod.laboratorio}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                        {prod.categoria}
                      </td>

                      {/* Presentation */}
                      <td className="py-3.5 px-4 text-stone-600 font-sans">
                        {prod.presentacion || '—'}
                      </td>

                      {/* Min / Step */}
                      <td className="py-3.5 px-4 text-center font-mono text-stone-700">
                        <span className="font-semibold">{prod.minimo}</span> {prod.unidad}
                        <span className="text-stone-400 mx-1">/</span>
                        <span className="text-stone-500">+{prod.paso}</span>
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4 text-center">
                        {prod.activo !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                            <XCircle className="w-3.5 h-3.5 text-stone-400" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded-md text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                            title="Editar insumo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteProductTarget(prod)}
                            className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Modal (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar insumo' : 'Nuevo insumo para catálogo'}
        description={`Cuenta activa: ${activeAccount?.nombre}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nombre del medicamento o insumo"
            placeholder="Ej: Bioabortogen H, Draxxin 100 mg/ml..."
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                Laboratorio (Proveedor)
              </label>
              <input
                type="text"
                list="lab-suggestions"
                placeholder="Ej: Biogénesis Bagó, Zoetis..."
                value={laboratorio}
                onChange={e => setLaboratorio(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded-lg px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/30 focus:border-[#1f4e38]"
                required
              />
              <datalist id="lab-suggestions">
                {availableLabs.map(l => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>

            <Select
              label="Categoría"
              value={categoria}
              onChange={e => setCategoria(e.target.value as ProductCategory)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Presentación (texto libre)"
                placeholder="Ej: frasco 100 ml, caja x 100, jeringa..."
                value={presentacion}
                onChange={e => setPresentacion(e.target.value)}
              />
            </div>

            <div>
              <Select
                label="Unidad de medida"
                value={unidad}
                onChange={e => setUnidad(e.target.value as ProductUnit)}
              >
                <option value="unidad">Unidad</option>
                <option value="caja">Caja</option>
                <option value="dosis">Dosis</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={1}
              label="Cantidad mínima"
              helperText="Mínimo que acepta el laboratorio"
              value={minimo}
              onChange={e => setMinimo(parseInt(e.target.value, 10) || 1)}
              required
            />

            <Input
              type="number"
              min={1}
              label="Paso de incremento"
              helperText="Incremento al sumar/restar"
              value={paso}
              onChange={e => setPaso(parseInt(e.target.value, 10) || 1)}
              required
            />
          </div>

          {/* Activo switch */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="product-activo"
              checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="w-4 h-4 text-[#1f4e38] rounded border-stone-300 focus:ring-[#1f4e38]"
            />
            <label htmlFor="product-activo" className="text-xs font-medium text-stone-700 cursor-pointer">
              Insumo activo (disponible para nuevas órdenes)
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
              {editingProduct ? 'Actualizar insumo' : 'Agregar insumo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Product Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Eliminar insumo del catálogo"
        message={`¿Desea eliminar "${deleteProductTarget?.nombre}" del catálogo de ${activeAccount?.nombre}?`}
        confirmLabel="Eliminar insumo"
        isTwoStep={true}
      />
    </div>
  );
};
