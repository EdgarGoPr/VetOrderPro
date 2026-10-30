import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Truck,
  Tag,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { api } from '../../services/api';
import type { Category, Product, ProductCategory, ProductUnit, Supplier } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/feedback/Toast';
import { getLaboratoryBadgeStyle } from '../../utils/formatters';

export const CatalogPage: React.FC = () => {
  const { activeAccount } = useAccount();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  // Category Management Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatNombre, setNewCatNombre] = useState<string>('');
  const [newCatDescripcion, setNewCatDescripcion] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!activeAccount) {
      setProducts([]);
      setCategories([]);
      setSuppliers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [productsData, categoriesData, suppliersData] = await Promise.all([
        api.products.getByAccount(activeAccount.id),
        api.categories.getByAccount(activeAccount.id),
        api.suppliers.getByAccount(activeAccount.id),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (err: any) {
      toast(err.message || 'Error al cargar catálogo', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeAccount, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Available laboratories (from suppliers + products)
  const availableLabs = useMemo(() => {
    const set = new Set<string>();
    suppliers.forEach(s => {
      if (s.nombre && s.nombre.trim()) set.add(s.nombre.trim());
    });
    products.forEach(p => {
      if (p.laboratorio && p.laboratorio.trim()) set.add(p.laboratorio.trim());
    });
    return Array.from(set).sort();
  }, [suppliers, products]);

  // Available categories (from categories + products)
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    categories.forEach(c => {
      if (c.nombre && c.nombre.trim()) set.add(c.nombre.trim());
    });
    products.forEach(p => {
      if (p.categoria && p.categoria.trim()) set.add(p.categoria.trim());
    });
    if (set.size === 0) {
      ['Vacunas', 'Antibióticos', 'Antiinflamatorios', 'Insumos', 'Antiparasitarios', 'Otros'].forEach(c => set.add(c));
    }
    return Array.from(set).sort();
  }, [categories, products]);

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
    setLaboratorio(availableLabs.length > 0 ? availableLabs[0] : '');
    setCategoria(availableCategories.length > 0 ? availableCategories[0] : 'Vacunas');
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

  // Category handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    if (!newCatNombre.trim()) {
      toast('El nombre de la categoría es obligatorio', 'error');
      return;
    }

    try {
      setSavingCategory(true);
      if (editingCategory) {
        await api.categories.update(editingCategory.id, {
          nombre: newCatNombre.trim(),
          descripcion: newCatDescripcion.trim() || undefined,
        });
        toast('Categoría actualizada', 'success');
      } else {
        await api.categories.create({
          cuenta_id: activeAccount.id,
          nombre: newCatNombre.trim(),
          descripcion: newCatDescripcion.trim() || undefined,
          activo: true,
        });
        toast('Categoría creada exitosamente', 'success');
      }
      setNewCatNombre('');
      setNewCatDescripcion('');
      setEditingCategory(null);
      await fetchProducts();
    } catch (err: any) {
      toast(err.message || 'Error al guardar categoría', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    try {
      await api.categories.delete(deleteCategoryTarget.id);
      toast('Categoría eliminada', 'success');
      setDeleteCategoryTarget(null);
      await fetchProducts();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar categoría', 'error');
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

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/proveedores')}
            icon={<Truck className="w-4 h-4 text-stone-600" />}
          >
            Proveedores ({suppliers.length})
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCategoryModalOpen(true)}
            icon={<Tag className="w-4 h-4 text-emerald-700" />}
          >
            Categorías ({categories.length})
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={openCreateModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo insumo
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, presentación o laboratorio..."
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
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters tags */}
        {(selectedLab !== 'Todos' || selectedCategory !== 'Todas' || search) && (
          <div className="flex items-center gap-2 pt-1 text-xs text-stone-500 flex-wrap">
            <span>Filtros activos:</span>
            {selectedLab !== 'Todos' && (
              <span className="inline-flex items-center gap-1 bg-[#1f4e38]/10 text-[#1f4e38] px-2 py-0.5 rounded-full text-[11px] font-medium">
                Lab: {selectedLab}
                <button onClick={() => setSelectedLab('Todos')} className="ml-0.5 hover:text-black">
                  ×
                </button>
              </span>
            )}
            {selectedCategory !== 'Todas' && (
              <span className="inline-flex items-center gap-1 bg-[#1f4e38]/10 text-[#1f4e38] px-2 py-0.5 rounded-full text-[11px] font-medium">
                Cat: {selectedCategory}
                <button onClick={() => setSelectedCategory('Todas')} className="ml-0.5 hover:text-black">
                  ×
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full text-[11px]">
                "{search}"
                <button onClick={() => setSearch('')} className="ml-0.5 hover:text-black">
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedLab('Todos');
                setSelectedCategory('Todas');
                setSearch('');
              }}
              className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer ml-1"
            >
              Limpiar todos
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Products Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div
              key={n}
              className="h-44 bg-white rounded-2xl border border-stone-200 animate-pulse p-4 space-y-3"
            >
              <div className="h-4 bg-stone-200 rounded w-1/3" />
              <div className="h-6 bg-stone-200 rounded w-3/4" />
              <div className="h-4 bg-stone-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200/90 shadow-2xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1f4e38]/10 text-[#1f4e38] flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              {products.length === 0 ? 'Catálogo sin insumos' : 'No hay resultados'}
            </h3>
            <p className="text-xs text-stone-500">
              {products.length === 0
                ? 'Comience cargando los medicamentos, vacunas y productos utilizados en este feedlot o veterinaria.'
                : 'Intente modificar los términos de búsqueda o restablecer los filtros de laboratorio y categoría.'}
            </p>
          </div>
          {products.length === 0 ? (
            <Button variant="primary" size="md" onClick={openCreateModal} icon={<Plus className="w-4 h-4" />}>
              Cargar primer insumo
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedLab('Todos');
                setSelectedCategory('Todas');
              }}
            >
              Restablecer filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(prod => {
            const labStyle = getLaboratoryBadgeStyle(prod.laboratorio);

            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl p-5 border border-stone-200/90 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between ${
                  !prod.activo ? 'opacity-60 bg-stone-50/50' : ''
                }`}
              >
                <div>
                  {/* Top Bar: Laboratory and Category */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${labStyle.bg} ${labStyle.text} ${labStyle.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${labStyle.dot}`} />
                      {prod.laboratorio}
                    </span>

                    <span className="text-[10px] font-mono uppercase text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                      {prod.categoria}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h3 className="font-semibold text-sm text-stone-900 leading-snug">
                    {prod.nombre}
                  </h3>

                  {/* Presentation */}
                  <p className="text-xs text-stone-500 mt-1 italic font-sans">
                    {prod.presentacion || 'Sin presentación definida'}
                  </p>

                  {/* Parameters: Minimum and Step */}
                  <div className="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                      <span className="text-stone-400 block text-[9px] uppercase">Mínimo</span>
                      <span className="font-semibold text-stone-800">
                        {prod.minimo} {prod.unidad}
                        {prod.minimo > 1 && prod.unidad === 'unidad' ? 'es' : prod.minimo > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200/60">
                      <span className="text-stone-400 block text-[9px] uppercase">Paso / Salto</span>
                      <span className="font-semibold text-stone-800">
                        +{prod.paso} {prod.unidad}
                        {prod.paso > 1 && prod.unidad === 'unidad' ? 'es' : prod.paso > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                    {prod.activo ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Activo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-stone-400" />
                        <span>Inactivo</span>
                      </>
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Editar insumo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteProductTarget(prod)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar insumo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Editar insumo' : 'Nuevo insumo de catálogo'}
        description="Defina las características del medicamento o insumo y sus reglas de pedido."
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nombre del medicamento o insumo"
            placeholder="Ej: Bioabortogen H, Draxxin, Flunixin Bagó..."
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Laboratorio / Proveedor"
                placeholder="Ej: Biogénesis Bagó, Zoetis, MSD..."
                value={laboratorio}
                onChange={e => setLaboratorio(e.target.value)}
                list="suppliers-list"
                required
              />
              <datalist id="suppliers-list">
                {availableLabs.map(lab => (
                  <option key={lab} value={lab} />
                ))}
              </datalist>
            </div>

            <Select
              label="Categoría"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Presentación"
              placeholder="Ej: frasco 100 ml, caja x 100, frasco 25 dosis"
              value={presentacion}
              onChange={e => setPresentacion(e.target.value)}
              helperText="Visible en la orden de compra"
              required
            />

            <Select
              label="Unidad de medida"
              value={unidad}
              onChange={e => setUnidad(e.target.value as ProductUnit)}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cantidad mínima"
              type="number"
              min={1}
              value={minimo}
              onChange={e => setMinimo(Math.max(1, parseInt(e.target.value, 10) || 1))}
              helperText="Mínimo que acepta el proveedor"
              required
            />

            <Input
              label="Paso / Incremento"
              type="number"
              min={1}
              value={paso}
              onChange={e => setPaso(Math.max(1, parseInt(e.target.value, 10) || 1))}
              helperText="Salto permitido al sumar/restar"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prod-activo-checkbox"
              checked={activo}
              onChange={e => setActivo(e.target.checked)}
              className="w-4 h-4 text-[#1f4e38] rounded border-stone-300 focus:ring-[#1f4e38]"
            />
            <label
              htmlFor="prod-activo-checkbox"
              className="text-xs font-medium text-stone-700 cursor-pointer"
            >
              Insumo activo (disponible para nuevas órdenes de compra)
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
              {editingProduct ? 'Actualizar insumo' : 'Guardar en catálogo'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Management Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
          setNewCatNombre('');
          setNewCatDescripcion('');
        }}
        title="Gestión de Categorías de Insumos"
        description="Administre las categorías disponibles para clasificar insumos y medicamentos."
      >
        <div className="space-y-5">
          {/* Create / Edit Category Form */}
          <form onSubmit={handleSaveCategory} className="bg-stone-50/80 p-3.5 rounded-xl border border-stone-200/80 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-stone-600 font-semibold">
              {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Input
                placeholder="Nombre (ej: Hormonales, Minerales...)"
                value={newCatNombre}
                onChange={e => setNewCatNombre(e.target.value)}
                required
              />
              <Input
                placeholder="Descripción opcional"
                value={newCatDescripcion}
                onChange={e => setNewCatDescripcion(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              {editingCategory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(null);
                    setNewCatNombre('');
                    setNewCatDescripcion('');
                  }}
                >
                  Cancelar edición
                </Button>
              )}
              <Button type="submit" variant="primary" size="sm" loading={savingCategory}>
                {editingCategory ? 'Actualizar categoría' : 'Crear categoría'}
              </Button>
            </div>
          </form>

          {/* Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-stone-500">
              Categorías activas ({categories.length})
            </h4>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto bg-white">
              {categories.map(cat => {
                const count = products.filter(p => p.categoria.toLowerCase() === cat.nombre.toLowerCase()).length;

                return (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-stone-50/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-stone-900">{cat.nombre}</span>
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-600 px-2 py-0.2 rounded-full">
                          {count} {count === 1 ? 'insumo' : 'insumos'}
                        </span>
                      </div>
                      {cat.descripcion && (
                        <p className="text-[11px] text-stone-500 mt-0.5">{cat.descripcion}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCatNombre(cat.nombre);
                          setNewCatDescripcion(cat.descripcion || '');
                        }}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                        title="Editar categoría"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCategoryTarget(cat)}
                        className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Eliminar categoría"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Product Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Eliminar insumo del catálogo"
        message={`¿Está seguro de que desea eliminar "${deleteProductTarget?.nombre}"? Las órdenes de compra pasadas conservarán sus datos históricos.`}
        confirmLabel="Eliminar insumo"
        isTwoStep={true}
      />

      {/* Delete Category Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCategoryTarget)}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Eliminar categoría"
        message={`¿Está seguro de que desea eliminar la categoría "${deleteCategoryTarget?.nombre}"? Los insumos mantendrán su nombre de categoría actual.`}
        confirmLabel="Eliminar categoría"
        isTwoStep={true}
      />
    </div>
  );
};
