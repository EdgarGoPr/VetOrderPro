import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Package,
  ArrowRight,
  Tag,
  Building2,
} from 'lucide-react';
import { useAccount } from '../../context/AccountContext';
import { api } from '../../services/api';
import type { Category, Product, ProductUnit, Supplier } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/feedback/Toast';
import { getLaboratoryBadgeStyle } from '../../utils/formatters';

export const SuppliersPage: React.FC = () => {
  const { activeAccount } = useAccount();
  const { toast } = useToast();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected supplier in workspace
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [supplierProductsSearch, setSupplierProductsSearch] = useState<string>('');

  // Supplier Modal (Create / Edit)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supNombre, setSupNombre] = useState<string>('');
  const [supContacto, setSupContacto] = useState<string>('');
  const [supTelefono, setSupTelefono] = useState<string>('');
  const [supEmail, setSupEmail] = useState<string>('');
  const [supDireccion, setSupDireccion] = useState<string>('');
  const [supNotas, setSupNotas] = useState<string>('');
  const [supActivo, setSupActivo] = useState<boolean>(true);
  const [savingSupplier, setSavingSupplier] = useState<boolean>(false);
  const [deleteSupplierTarget, setDeleteSupplierTarget] = useState<Supplier | null>(null);

  // Product Modal (for adding / editing product from supplier screen)
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodNombre, setProdNombre] = useState<string>('');
  const [prodCategoria, setProdCategoria] = useState<string>('Vacunas');
  const [prodPresentacion, setProdPresentacion] = useState<string>('');
  const [prodUnidad, setProdUnidad] = useState<ProductUnit>('unidad');
  const [prodMinimo, setProdMinimo] = useState<number>(1);
  const [prodPaso, setProdPaso] = useState<number>(1);
  const [prodActivo, setProdActivo] = useState<boolean>(true);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  // Categories Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatNombre, setNewCatNombre] = useState<string>('');
  const [newCatDescripcion, setNewCatDescripcion] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [savingCategory, setSavingCategory] = useState<boolean>(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);

  // Load all suppliers, products and categories for the active account
  const loadData = useCallback(async () => {
    if (!activeAccount) {
      setSuppliers([]);
      setProducts([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [suppliersData, productsData, categoriesData] = await Promise.all([
        api.suppliers.getByAccount(activeAccount.id),
        api.products.getByAccount(activeAccount.id),
        api.categories.getByAccount(activeAccount.id),
      ]);

      setSuppliers(suppliersData);
      setProducts(productsData);
      setCategories(categoriesData);

      // Select first supplier if none selected or if selected is not in list
      if (suppliersData.length > 0) {
        if (!selectedSupplierId || !suppliersData.some(s => s.id === selectedSupplierId)) {
          setSelectedSupplierId(suppliersData[0].id);
        }
      } else {
        setSelectedSupplierId(null);
      }
    } catch (err: any) {
      toast(err.message || 'Error cargando proveedores', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeAccount, selectedSupplierId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active selected supplier
  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Insumos belonging to the selected supplier
  const supplierProducts = useMemo(() => {
    if (!selectedSupplier) return [];
    return products.filter(
      p => p.laboratorio.toLowerCase().trim() === selectedSupplier.nombre.toLowerCase().trim()
    );
  }, [products, selectedSupplier]);

  // Filtered insumos inside the selected supplier view
  const filteredSupplierProducts = useMemo(() => {
    if (!supplierProductsSearch.trim()) return supplierProducts;
    const q = supplierProductsSearch.toLowerCase().trim();
    return supplierProducts.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        p.presentacion.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );
  }, [supplierProducts, supplierProductsSearch]);

  // Filtered suppliers list (left column)
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const q = searchQuery.toLowerCase().trim();
    return suppliers.filter(
      s =>
        s.nombre.toLowerCase().includes(q) ||
        (s.contacto && s.contacto.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [suppliers, searchQuery]);

  // Supplier handlers
  const openCreateSupplierModal = () => {
    setEditingSupplier(null);
    setSupNombre('');
    setSupContacto('');
    setSupTelefono('');
    setSupEmail('');
    setSupDireccion('');
    setSupNotas('');
    setSupActivo(true);
    setIsSupplierModalOpen(true);
  };

  const openEditSupplierModal = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupNombre(sup.nombre);
    setSupContacto(sup.contacto || '');
    setSupTelefono(sup.telefono || '');
    setSupEmail(sup.email || '');
    setSupDireccion(sup.direccion || '');
    setSupNotas(sup.notas || '');
    setSupActivo(sup.activo);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;
    if (!supNombre.trim()) {
      toast('El nombre del proveedor es obligatorio', 'error');
      return;
    }

    try {
      setSavingSupplier(true);
      if (editingSupplier) {
        await api.suppliers.update(editingSupplier.id, {
          nombre: supNombre.trim(),
          contacto: supContacto.trim() || undefined,
          telefono: supTelefono.trim() || undefined,
          email: supEmail.trim() || undefined,
          direccion: supDireccion.trim() || undefined,
          notas: supNotas.trim() || undefined,
          activo: supActivo,
        });
        toast('Proveedor actualizado con éxito', 'success');
      } else {
        const created = await api.suppliers.create({
          cuenta_id: activeAccount.id,
          nombre: supNombre.trim(),
          contacto: supContacto.trim() || undefined,
          telefono: supTelefono.trim() || undefined,
          email: supEmail.trim() || undefined,
          direccion: supDireccion.trim() || undefined,
          notas: supNotas.trim() || undefined,
          activo: supActivo,
        });
        setSelectedSupplierId(created.id);
        toast('Proveedor creado con éxito', 'success');
      }
      setIsSupplierModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Error al guardar proveedor', 'error');
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!deleteSupplierTarget) return;
    try {
      await api.suppliers.delete(deleteSupplierTarget.id);
      toast('Proveedor eliminado correctamente', 'success');
      setDeleteSupplierTarget(null);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar proveedor', 'error');
    }
  };

  // Product handlers (directly from supplier screen)
  const openCreateProductForSupplier = () => {
    if (!selectedSupplier) return;
    setEditingProduct(null);
    setProdNombre('');
    setProdCategoria(categories.length > 0 ? categories[0].nombre : 'Vacunas');
    setProdPresentacion('');
    setProdUnidad('unidad');
    setProdMinimo(1);
    setProdPaso(1);
    setProdActivo(true);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdNombre(prod.nombre);
    setProdCategoria(prod.categoria);
    setProdPresentacion(prod.presentacion);
    setProdUnidad(prod.unidad);
    setProdMinimo(prod.minimo);
    setProdPaso(prod.paso);
    setProdActivo(prod.activo);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount || !selectedSupplier) return;
    if (!prodNombre.trim()) {
      toast('El nombre del insumo es obligatorio', 'error');
      return;
    }

    try {
      setSavingProduct(true);
      if (editingProduct) {
        await api.products.update(editingProduct.id, {
          nombre: prodNombre.trim(),
          laboratorio: selectedSupplier.nombre,
          categoria: prodCategoria,
          presentacion: prodPresentacion.trim(),
          unidad: prodUnidad,
          minimo: Number(prodMinimo) || 1,
          paso: Number(prodPaso) || 1,
          activo: prodActivo,
        });
        toast('Insumo actualizado correctamente', 'success');
      } else {
        await api.products.create({
          cuenta_id: activeAccount.id,
          nombre: prodNombre.trim(),
          laboratorio: selectedSupplier.nombre,
          categoria: prodCategoria,
          presentacion: prodPresentacion.trim(),
          unidad: prodUnidad,
          minimo: Number(prodMinimo) || 1,
          paso: Number(prodPaso) || 1,
          activo: prodActivo,
        });
        toast(`Insumo agregado a ${selectedSupplier.nombre}`, 'success');
      }
      setIsProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Error al guardar insumo', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    try {
      await api.products.delete(deleteProductTarget.id);
      toast('Insumo eliminado correctamente', 'success');
      setDeleteProductTarget(null);
      await loadData();
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
      await loadData();
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
      await loadData();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar categoría', 'error');
    }
  };

  if (!activeAccount) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <Building2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold font-serif text-stone-800">Seleccione una cuenta activa</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-stone-900 tracking-tight">
              Proveedores y Laboratorios
            </h1>
            <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full border border-stone-200">
              {suppliers.length} laboratorios
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5 font-sans">
            Gestione proveedores y administre los insumos directamente desde la ficha de cada laboratorio.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCategoryModalOpen(true)}
            icon={<Tag className="w-4 h-4 text-emerald-700" />}
          >
            Gestionar categorías ({categories.length})
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={openCreateSupplierModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Nuevo proveedor
          </Button>
        </div>
      </div>

      {/* Main Two-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Suppliers List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200/90 shadow-2xs overflow-hidden flex flex-col">
          <div className="p-3.5 border-b border-stone-100 space-y-2 bg-[#fbfaf7]/60">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar laboratorio o proveedor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/20 focus:border-[#1f4e38]"
              />
            </div>
          </div>

          <div className="divide-y divide-stone-100 max-h-[750px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs font-mono text-stone-400">
                Cargando laboratorios...
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No se encontraron proveedores.
              </div>
            ) : (
              filteredSuppliers.map(sup => {
                const isSelected = sup.id === selectedSupplierId;
                const labBadge = getLaboratoryBadgeStyle(sup.nombre);
                const countItems = products.filter(
                  p => p.laboratorio.toLowerCase().trim() === sup.nombre.toLowerCase().trim()
                ).length;

                return (
                  <div
                    key={sup.id}
                    onClick={() => setSelectedSupplierId(sup.id)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#1f4e38]/5 border-l-4 border-l-[#1f4e38]'
                        : 'hover:bg-stone-50/80 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${labBadge.dot}`} />
                        <h3 className="font-semibold text-xs text-stone-900 truncate">
                          {sup.nombre}
                        </h3>
                        {!sup.activo && (
                          <span className="text-[9px] font-mono bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded">
                            Inactivo
                          </span>
                        )}
                      </div>

                      {sup.contacto && (
                        <p className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                          <span>{sup.contacto}</span>
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-medium">
                          <Package className="w-3 h-3 text-emerald-600" />
                          {countItems} {countItems === 1 ? 'insumo' : 'insumos'}
                        </span>

                        {sup.telefono && (
                          <span className="text-[10px] text-stone-400 font-mono truncate">
                            {sup.telefono}
                          </span>
                        )}
                      </div>
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 shrink-0 transition-transform mt-1 ${
                        isSelected ? 'text-[#1f4e38] translate-x-0.5' : 'text-stone-300'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Supplier Detail & Insumos Management (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedSupplier ? (
            <>
              {/* Supplier Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-serif text-lg font-bold text-stone-800 shadow-2xs shrink-0">
                      {selectedSupplier.nombre.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-serif text-xl md:text-2xl font-bold text-stone-900">
                          {selectedSupplier.nombre}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            getLaboratoryBadgeStyle(selectedSupplier.nombre).bg
                          } ${getLaboratoryBadgeStyle(selectedSupplier.nombre).text} ${
                            getLaboratoryBadgeStyle(selectedSupplier.nombre).border
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              getLaboratoryBadgeStyle(selectedSupplier.nombre).dot
                            }`}
                          />
                          Proveedor Oficial
                        </span>
                      </div>

                      {selectedSupplier.notas && (
                        <p className="text-xs text-stone-600 mt-1 italic">
                          "{selectedSupplier.notas}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditSupplierModal(selectedSupplier)}
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Editar proveedor
                    </Button>

                    <button
                      onClick={() => setDeleteSupplierTarget(selectedSupplier)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Eliminar proveedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Contact details bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600 pt-1">
                  {selectedSupplier.contacto && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-400 font-mono text-[10px] uppercase">
                        Contacto:
                      </span>
                      <span className="font-medium text-stone-800">{selectedSupplier.contacto}</span>
                    </div>
                  )}
                  {selectedSupplier.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-mono">{selectedSupplier.telefono}</span>
                    </div>
                  )}
                  {selectedSupplier.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="font-mono text-stone-700 truncate">{selectedSupplier.email}</span>
                    </div>
                  )}
                  {selectedSupplier.direccion && (
                    <div className="sm:col-span-3 flex items-center gap-2 pt-1 border-t border-stone-100 text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{selectedSupplier.direccion}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Insumos for this Supplier Section */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-[#1f4e38]" />
                      Insumos de {selectedSupplier.nombre}
                    </h3>
                    <p className="text-xs text-stone-500 font-sans mt-0.5">
                      Catálogo de medicamentos, biológicos y productos disponibles de este proveedor.
                    </p>
                  </div>

                  {/* Primary Action to add product to this supplier */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateProductForSupplier}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Agregar insumo a este proveedor
                  </Button>
                </div>

                {/* Filter within supplier's items */}
                {supplierProducts.length > 0 && (
                  <div className="flex items-center justify-between gap-4">
                    <div className="relative w-full sm:w-72">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrar insumos de este proveedor..."
                        value={supplierProductsSearch}
                        onChange={e => setSupplierProductsSearch(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1f4e38]/20 focus:border-[#1f4e38]"
                      />
                    </div>
                    <span className="text-xs font-mono text-stone-400 shrink-0">
                      {filteredSupplierProducts.length} de {supplierProducts.length} insumos
                    </span>
                  </div>
                )}

                {/* Products Table */}
                {filteredSupplierProducts.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-xl space-y-3">
                    <Package className="w-10 h-10 text-stone-300 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-stone-700">
                        {supplierProducts.length === 0
                          ? `No hay insumos cargados para ${selectedSupplier.nombre}`
                          : 'No hay coincidencias con la búsqueda'}
                      </p>
                      <p className="text-xs text-stone-500 mt-1">
                        Sume medicamentos, vacunas o insumos con sus dosis, unidades mínimas y pasos.
                      </p>
                    </div>
                    {supplierProducts.length === 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={openCreateProductForSupplier}
                        icon={<Plus className="w-4 h-4" />}
                      >
                        Cargar primer insumo
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-mono uppercase tracking-wider text-stone-500">
                          <th className="py-2.5 px-4 font-semibold">Insumo / Medicamento</th>
                          <th className="py-2.5 px-4 font-semibold">Categoría</th>
                          <th className="py-2.5 px-4 font-semibold">Presentación / Unidad</th>
                          <th className="py-2.5 px-4 font-semibold">Mínimo / Paso</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredSupplierProducts.map(p => (
                          <tr key={p.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <span className="font-semibold text-stone-900 block">{p.nombre}</span>
                              {!p.activo && (
                                <span className="text-[10px] text-stone-400 font-mono">Inactivo</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 text-stone-700 font-medium">
                                {p.categoria}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-stone-600">
                              <span className="font-medium text-stone-800">{p.presentacion}</span>
                              <span className="text-[10px] text-stone-400 block font-mono">
                                Unidad: {p.unidad}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-700">
                              <span className="font-medium text-stone-900">Mín: {p.minimo}</span>
                              <span className="text-stone-400 ml-1.5">• Paso: {p.paso}</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditProduct(p)}
                                  className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                                  title="Editar insumo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteProductTarget(p)}
                                  className="p-1 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Eliminar insumo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200/90 text-stone-400 space-y-3">
              <Truck className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-serif font-bold text-stone-700">
                Seleccione un proveedor o cree uno nuevo
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Los proveedores le permiten agrupar los insumos y generar órdenes de compra dirigidas a cada laboratorio.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={openCreateSupplierModal}
                icon={<Plus className="w-4 h-4" />}
              >
                Crear primer proveedor
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Create/Edit Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title={editingSupplier ? 'Editar proveedor / laboratorio' : 'Nuevo proveedor / laboratorio'}
        description="Registre un laboratorio o proveedor para emitir órdenes de compra y organizar insumos."
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <Input
            label="Nombre del Laboratorio / Proveedor"
            placeholder="Ej: Zoetis, Biogénesis Bagó, Tecnovax, Syntex..."
            value={supNombre}
            onChange={e => setSupNombre(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Persona de contacto / Representante"
              placeholder="Ej: Dr. Alejandro Dupont"
              value={supContacto}
              onChange={e => setSupContacto(e.target.value)}
            />

            <Input
              label="Teléfono / WhatsApp"
              placeholder="+54 9 11 ..."
              value={supTelefono}
              onChange={e => setSupTelefono(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Correo electrónico para pedidos"
              type="email"
              placeholder="pedidos@laboratorio.com"
              value={supEmail}
              onChange={e => setSupEmail(e.target.value)}
            />

            <Input
              label="Dirección / Localidad"
              placeholder="Ej: Pilar, Buenos Aires"
              value={supDireccion}
              onChange={e => setSupDireccion(e.target.value)}
            />
          </div>

          <Input
            label="Observaciones o condiciones de entrega"
            placeholder="Ej: Cadena de frío estricta, entrega los martes, etc."
            value={supNotas}
            onChange={e => setSupNotas(e.target.value)}
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sup-activo"
              checked={supActivo}
              onChange={e => setSupActivo(e.target.checked)}
              className="w-4 h-4 text-[#1f4e38] rounded border-stone-300 focus:ring-[#1f4e38]"
            />
            <label htmlFor="sup-activo" className="text-xs font-medium text-stone-700 cursor-pointer">
              Proveedor activo para órdenes de compra
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsSupplierModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={savingSupplier}>
              {editingSupplier ? 'Actualizar proveedor' : 'Crear proveedor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Product Create/Edit for this Supplier Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Editar insumo' : `Nuevo insumo para ${selectedSupplier?.nombre}`}
        description={`Configure el insumo y sus parámetros de cantidad para ${selectedSupplier?.nombre}.`}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nombre del medicamento o insumo"
            placeholder="Ej: Bioabortogen H, Draxxin, Resflor Gold..."
            value={prodNombre}
            onChange={e => setProdNombre(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Categoría"
              value={prodCategoria}
              onChange={e => setProdCategoria(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.nombre}
                </option>
              ))}
              {!categories.some(c => c.nombre === prodCategoria) && (
                <option value={prodCategoria}>{prodCategoria}</option>
              )}
            </Select>

            <Input
              label="Presentación"
              placeholder="Ej: frasco 100 ml, frasco 25 dosis, caja x 100"
              value={prodPresentacion}
              onChange={e => setProdPresentacion(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Unidad"
              value={prodUnidad}
              onChange={e => setProdUnidad(e.target.value as ProductUnit)}
            >
              <option value="Frasco">Frasco</option>
              <option value="Bidón">Bidón</option>
              <option value="Bolsa">Bolsa</option>
              <option value="Caja">Caja</option>
              <option value="Unidad">Unidad</option>
              <option value="dosis">Dosis</option>
            </Select>

            <Input
              label="Mínimo pedido"
              type="number"
              min={1}
              value={prodMinimo}
              onChange={e => setProdMinimo(Math.max(1, parseInt(e.target.value, 10) || 1))}
              required
            />

            <Input
              label="Paso / Salto"
              type="number"
              min={1}
              value={prodPaso}
              onChange={e => setProdPaso(Math.max(1, parseInt(e.target.value, 10) || 1))}
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="prod-activo"
              checked={prodActivo}
              onChange={e => setProdActivo(e.target.checked)}
              className="w-4 h-4 text-[#1f4e38] rounded border-stone-300 focus:ring-[#1f4e38]"
            />
            <label htmlFor="prod-activo" className="text-xs font-medium text-stone-700 cursor-pointer">
              Insumo activo en catálogo
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={savingProduct}>
              {editingProduct ? 'Actualizar insumo' : 'Agregar insumo'}
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

      {/* Delete Supplier Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteSupplierTarget)}
        onClose={() => setDeleteSupplierTarget(null)}
        onConfirm={handleDeleteSupplier}
        title="Eliminar proveedor"
        message={`¿Está seguro de que desea eliminar el proveedor "${deleteSupplierTarget?.nombre}"?`}
        confirmLabel="Eliminar proveedor"
        isTwoStep={true}
      />

      {/* Delete Product Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteProductTarget)}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={handleDeleteProduct}
        title="Eliminar insumo"
        message={`¿Está seguro de que desea eliminar el insumo "${deleteProductTarget?.nombre}" de este proveedor?`}
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
