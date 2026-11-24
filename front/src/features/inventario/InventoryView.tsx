import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiPatch, apiPost } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable, EmptyState, Field, Panel, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { Category, Loadable, Product, Sale, StockMovement } from "../../shared/types/models";
import { exportToCsv, formatDate, formatMoney } from "../../shared/utils/formatters";

type InventoryViewProps = {
  categories: Loadable<Category[]>;
  onCreated: () => void;
  products: Loadable<Product[]>;
  sales: Loadable<Sale[]>;
  stockMovements: Loadable<StockMovement[]>;
};

export function InventoryView({
  categories,
  onCreated,
  products,
  stockMovements,
}: InventoryViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"catalog" | "adjust" | "history" | "new">("catalog");
  const [selectedKardexProduct, setSelectedKardexProduct] = useState<Product | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    cost_price: "",
    stock: "",
    min_stock: "5",
    sku: "",
    barcode: "",
  });
  const [selectedParentId, setSelectedParentId] = useState("");
  const [selectedSubId, setSelectedSubId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    cost_price: "",
    min_stock: "5",
    sku: "",
    barcode: "",
    categoryId: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Deactivate / Delete product confirm
  const [togglingProduct, setTogglingProduct] = useState<Product | null>(null);
  const [toggling, setToggling] = useState(false);

  // Manual stock adjustment states
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState("Entrada");
  const [adjustReason, setAdjustReason] = useState("RECUENTO");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const newProductNameRef = useRef<HTMLInputElement>(null);
  const adjustProductSelectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (activeTab === "new") {
      setTimeout(() => newProductNameRef.current?.focus(), 50);
    } else if (activeTab === "adjust") {
      setTimeout(() => adjustProductSelectRef.current?.focus(), 50);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedKardexProduct) {
          e.preventDefault();
          setSelectedKardexProduct(null);
        } else if (editingProduct) {
          e.preventDefault();
          setEditingProduct(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedKardexProduct, editingProduct]);

  const parentCategories = useMemo(() => {
    return categories.data.filter((c) => !c.name.includes(" > "));
  }, [categories.data]);

  const subCategories = useMemo(() => {
    if (!selectedParentId) return [];
    const parent = parentCategories.find((c) => c.id === Number(selectedParentId));
    if (!parent) return [];
    return categories.data.filter((c) => c.name.startsWith(parent.name + " > "));
  }, [selectedParentId, categories.data, parentCategories]);

  const filteredProducts = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return products.data.filter((p) => {
      if (!showInactive && !p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products.data, catalogSearch, showInactive]);

  const submitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const chosenCatId = selectedSubId
        ? Number(selectedSubId)
        : selectedParentId
          ? Number(selectedParentId)
          : null;

      await apiPost<Product>("/products/", {
        active: true,
        category_ids: chosenCatId ? [chosenCatId] : [],
        name: form.name,
        price: Number(form.price),
        cost_price: form.cost_price ? Number(form.cost_price) : 0,
        stock: Number(form.stock),
        min_stock: form.min_stock ? Number(form.min_stock) : 5,
        sku: form.sku.trim() || null,
        barcode: form.barcode.trim() || null,
      });

      setForm({ name: "", price: "", cost_price: "", stock: "", min_stock: "5", sku: "", barcode: "" });
      setSelectedParentId("");
      setSelectedSubId("");
      setActiveTab("catalog");
      showToast("Producto creado correctamente", "success");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el producto";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditForm({
      name: p.name,
      price: String(p.price),
      cost_price: String(p.cost_price ?? 0),
      min_stock: String(p.min_stock ?? 5),
      sku: p.sku ?? "",
      barcode: p.barcode ?? "",
      categoryId: p.categories.length > 0 ? String(p.categories[0].id) : "",
    });
  };

  const submitEditProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingEdit(true);
    try {
      await apiPatch<Product>(`/products/${editingProduct.id}`, {
        name: editForm.name.trim(),
        price: Number(editForm.price),
        cost_price: editForm.cost_price ? Number(editForm.cost_price) : 0,
        min_stock: editForm.min_stock ? Number(editForm.min_stock) : 5,
        sku: editForm.sku.trim() || "",
        barcode: editForm.barcode.trim() || "",
        category_ids: editForm.categoryId ? [Number(editForm.categoryId)] : [],
      });
      setEditingProduct(null);
      showToast("Producto actualizado correctamente", "success");
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error al actualizar producto", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!togglingProduct) return;
    setToggling(true);
    try {
      if (togglingProduct.active) {
        await apiDelete(`/products/${togglingProduct.id}`);
        showToast(`Producto "${togglingProduct.name}" desactivado`, "info");
      } else {
        await apiPatch(`/products/${togglingProduct.id}`, { active: true });
        showToast(`Producto "${togglingProduct.name}" reactivado`, "success");
      }
      setTogglingProduct(null);
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo cambiar el estado del producto", "error");
      setTogglingProduct(null);
    } finally {
      setToggling(false);
    }
  };

  const submitAdjustment = async (e: FormEvent) => {
    e.preventDefault();
    if (!adjustProductId) {
      setAdjustError("Selecciona un producto.");
      return;
    }
    const qty = Number(adjustQty);
    if (isNaN(qty) || qty < 0) {
      setAdjustError("La cantidad debe ser un número mayor o igual a 0.");
      return;
    }

    setAdjusting(true);
    setAdjustError(null);

    try {
      const adjustment_type = adjustType === "Ajuste" ? "SET" : "ADD";
      const finalQty = adjustType === "Salida" ? -qty : qty;

      await apiPost(`/products/${adjustProductId}/adjust-stock`, {
        adjustment_type,
        quantity: finalQty,
        reason: adjustReason,
        notes: adjustNotes.trim() || null,
      });

      setAdjustProductId("");
      setAdjustQty("");
      setAdjustNotes("");
      setActiveTab("catalog");
      showToast("Ajuste de inventario y Kardex guardados correctamente", "success");
      onCreated();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al registrar el ajuste de stock";
      setAdjustError(msg);
      showToast(msg, "error");
    } finally {
      setAdjusting(false);
    }
  };

  const handleExportCatalog = () => {
    exportToCsv(
      `inventario_gestock_${new Date().toISOString().slice(0, 10)}.csv`,
      ["ID", "Nombre", "Categoría", "SKU", "Código de Barras", "Precio Costo", "Precio Venta", "Stock", "Stock Mínimo", "Estado"],
      filteredProducts.map((p) => [
        p.id,
        p.name,
        p.categories.map((c) => c.name).join(", ") || "Sin categoría",
        p.sku ?? "",
        p.barcode ?? "",
        p.cost_price ?? 0,
        p.price,
        p.stock,
        p.min_stock ?? 5,
        p.active ? "Activo" : "Inactivo",
      ]),
    );
    showToast("Catálogo exportado a CSV", "success");
  };

  return (
    <div className="stack">
      <div className="tabs-header">
        <button
          className={`tab-button ${activeTab === "catalog" ? "active" : ""}`}
          onClick={() => setActiveTab("catalog")}
          type="button"
        >
          Catálogo de Productos
        </button>
        <button
          className={`tab-button ${activeTab === "new" ? "active" : ""}`}
          onClick={() => setActiveTab("new")}
          type="button"
        >
          Nuevo Producto
        </button>
        <button
          className={`tab-button ${activeTab === "adjust" ? "active" : ""}`}
          onClick={() => setActiveTab("adjust")}
          type="button"
        >
          Ajustar Stock
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          type="button"
        >
          Auditoría de Stock (Kardex)
        </button>
      </div>

      {activeTab === "catalog" && (
        <div className="stack">
          <div className="panel" style={{ padding: "14px 16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <input
                placeholder="Buscar producto por nombre, SKU o código de barras..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
              />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Mostrar inactivos
            </label>
          </div>
          <Panel
            title="Inventario de Productos"
            state={products}
            actions={
              <button type="button" className="secondary-button action-btn-sm" onClick={handleExportCatalog}>
                ⬇ Exportar CSV
              </button>
            }
          >
            <DataTable
              columns={[
                "Producto",
                "Categoría",
                "SKU / Cód.",
                "P. Costo",
                "P. Venta",
                "Stock",
                "Estado",
                "Acciones",
              ]}
              rows={filteredProducts.map((p) => {
                const catNames = p.categories.map((c) => c.name).join(", ");
                const displayCategory = catNames || "Sin categoría";
                const isLowStock = p.stock <= (p.min_stock ?? 5);
                return [
                  p.name,
                  displayCategory,
                  <div key={`code-${p.id}`} style={{ fontSize: "0.8rem" }}>
                    {p.sku && <div>SKU: {p.sku}</div>}
                    {p.barcode && (
                      <div style={{ fontFamily: "ui-monospace, monospace", color: "var(--text-secondary)" }}>
                        {p.barcode}
                      </div>
                    )}
                    {!p.sku && !p.barcode && "-"}
                  </div>,
                  formatMoney(p.cost_price ?? 0),
                  formatMoney(p.price),
                  <span
                    style={{
                      fontWeight: 700,
                      color: p.stock === 0 ? "#ef4444" : isLowStock ? "#f59e0b" : "inherit",
                    }}
                    key={`stk-${p.id}`}
                  >
                    {p.stock} u. {isLowStock ? "⚠️" : ""}
                  </span>,
                  p.active ? "Activo" : "Inactivo",
                  <div style={{ display: "flex", gap: "6px" }} key={`act-${p.id}`}>
                    <button
                      className="secondary-button action-btn-sm"
                      type="button"
                      onClick={() => openEditModal(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="secondary-button action-btn-sm"
                      type="button"
                      onClick={() => setSelectedKardexProduct(p)}
                    >
                      Kardex
                    </button>
                    <button
                      className="secondary-button action-btn-sm"
                      style={{ color: p.active ? "#ef4444" : "#10b981" }}
                      type="button"
                      onClick={() => setTogglingProduct(p)}
                    >
                      {p.active ? "Baja" : "Activar"}
                    </button>
                  </div>,
                ];
              })}
            />
          </Panel>
        </div>
      )}

      {activeTab === "new" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
          <form className="form-panel" onSubmit={(e) => void submitProduct(e)}>
            <h3>Agregar Nuevo Producto al Catálogo</h3>

            <Field label="Nombre del Producto">
              <input
                ref={newProductNameRef}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>

            <div className="form-row">
              <Field label="Precio de Costo ($)">
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="Ej. 750.00"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                />
              </Field>
              <Field label="Precio de Venta ($)">
                <input
                  min="0.01"
                  step="0.01"
                  type="number"
                  required
                  placeholder="Ej. 1200.00"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Stock Inicial">
                <input
                  min="0"
                  type="number"
                  required
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </Field>
              <Field label="Stock Mínimo Alerta">
                <input
                  min="0"
                  type="number"
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
                />
              </Field>
            </div>

            <div className="form-row">
              <Field label="SKU / Identificador Código">
                <input
                  placeholder="Ej. SKU-PROD123"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                />
              </Field>
              <Field label="Código de Barras (EAN / UPC)">
                <input
                  placeholder="Ej. 7791234567890"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Categoría Principal">
                <select
                  value={selectedParentId}
                  onChange={(e) => {
                    setSelectedParentId(e.target.value);
                    setSelectedSubId("");
                  }}
                >
                  <option value="">Ninguna</option>
                  {parentCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategoría">
                <select
                  disabled={!selectedParentId}
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                >
                  <option value="">Seleccionar subcategoría</option>
                  {subCategories.map((c) => {
                    const cleanSub = c.name.split(" > ")[1] || c.name;
                    return (
                      <option key={c.id} value={c.id}>
                        {cleanSub}
                      </option>
                    );
                  })}
                </select>
              </Field>
            </div>

            <SubmitButton label="Crear Producto en Sistema" saving={saving} />
            {error ? <p className="form-error">{error}</p> : null}
          </form>

          <div className="panel" style={{ padding: "20px" }}>
            <h4>Ayuda de Registro</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "10px", lineHeight: "1.4" }}>
              Ingresa el código SKU y el Código de barras para posibilitar el uso de lectores rápidos de barra de pistolas
              POS y búsquedas inteligentes por texto parcial.
            </p>
          </div>
        </div>
      )}

      {activeTab === "adjust" && (
        <form className="form-panel" onSubmit={(e) => void submitAdjustment(e)} style={{ maxWidth: "600px" }}>
          <h3>Ajuste de Stock Manual</h3>

          <Field label="Producto a Modificar">
            <select
              ref={adjustProductSelectRef}
              value={adjustProductId}
              onChange={(e) => setAdjustProductId(e.target.value)}
            >
              <option value="">Elegir producto...</option>
              {products.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.barcode ? `[Cód: ${p.barcode}]` : ""} (Stock: {p.stock} u.)
                </option>
              ))}
            </select>
          </Field>

          <div className="form-row">
            <Field label="Tipo de Movimiento">
              <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)}>
                <option value="Entrada">Entrada (+ Sumar unidades)</option>
                <option value="Salida">Salida / Merma (- Restar unidades)</option>
                <option value="Ajuste">Recuento Físico (Sobrescribir stock total)</option>
              </select>
            </Field>
            <Field label="Motivo del Ajuste">
              <select value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
                <option value="RECUENTO">Recuento de Inventario</option>
                <option value="ROTURA">Rotura / Daño</option>
                <option value="MERMA">Merma / Pérdida</option>
                <option value="VENCIMIENTO">Vencimiento</option>
                <option value="AJUSTE_MANUAL">Ajuste Manual / Ingreso Extra</option>
              </select>
            </Field>
          </div>

          <Field label={adjustType === "Ajuste" ? "Nuevo Stock Total Físico" : "Cantidad de Unidades"}>
            <input
              min="0"
              required
              type="number"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
            />
          </Field>

          <Field label="Notas / Concepto de Auditoría">
            <input
              placeholder="Ej. Corrección por rotura o Ingreso de prueba"
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
            />
          </Field>

          <SubmitButton label="Guardar Ajuste en Kardex" saving={adjusting} />
          {adjustError ? <p className="form-error">{adjustError}</p> : null}
        </form>
      )}

      {activeTab === "history" && (
        <Panel title="Registro de Entradas, Salidas y Ajustes (Kardex General)" state={stockMovements}>
          <DataTable
            columns={["Fecha", "Producto", "Movimiento", "Cant.", "Stock Previo", "Stock Resultante", "Concepto / Notas"]}
            rows={stockMovements.data.map((m) => [
              formatDate(m.created_at),
              m.product_name || `Producto #${m.product_id}`,
              m.movement_type,
              <span
                key={m.id}
                style={{
                  fontWeight: 700,
                  color: m.quantity > 0 ? "#10b981" : m.quantity < 0 ? "#ef4444" : "inherit",
                }}
              >
                {m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`} u.
              </span>,
              `${m.previous_stock} u.`,
              <strong>{m.current_stock} u.</strong>,
              m.notes || m.reference_type || "-",
            ])}
          />
        </Panel>
      )}

      {editingProduct && (
        <div className="modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Producto</h3>
              <button className="close-button" type="button" onClick={() => setEditingProduct(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => void submitEditProduct(e)}>
              <div className="modal-body">
                <Field label="Nombre del Producto">
                  <input
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </Field>
                <div className="form-row">
                  <Field label="Precio de Costo ($)">
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={editForm.cost_price}
                      onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })}
                    />
                  </Field>
                  <Field label="Precio de Venta ($)">
                    <input
                      min="0.01"
                      step="0.01"
                      type="number"
                      required
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="form-row">
                  <Field label="SKU">
                    <input
                      value={editForm.sku}
                      onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                    />
                  </Field>
                  <Field label="Código de Barras">
                    <input
                      value={editForm.barcode}
                      onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                    />
                  </Field>
                </div>
                <div className="form-row">
                  <Field label="Stock Mínimo Alerta">
                    <input
                      min="0"
                      type="number"
                      value={editForm.min_stock}
                      onChange={(e) => setEditForm({ ...editForm, min_stock: e.target.value })}
                    />
                  </Field>
                  <Field label="Categoría">
                    <select
                      value={editForm.categoryId}
                      onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    >
                      <option value="">Sin categoría</option>
                      {categories.data.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="modal-footer">
                <button className="secondary-button" type="button" onClick={() => setEditingProduct(null)}>
                  Cancelar
                </button>
                <SubmitButton label="Guardar Cambios" saving={savingEdit} />
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKardexProduct && (
        <div className="modal-backdrop" onClick={() => setSelectedKardexProduct(null)}>
          <div className="modal-content" style={{ maxWidth: "750px", width: "95%" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Historial Kardex: {selectedKardexProduct.name}</h3>
                <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  SKU: <strong>{selectedKardexProduct.sku || "-"}</strong> &bull; Código de Barras:{" "}
                  <strong style={{ fontFamily: "monospace" }}>{selectedKardexProduct.barcode || "-"}</strong> &bull;
                  Stock Actual: <strong>{selectedKardexProduct.stock} u.</strong>
                </div>
              </div>
              <button className="close-button" type="button" onClick={() => setSelectedKardexProduct(null)}>
                &times;
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {(() => {
                const prodMovements = stockMovements.data.filter((m) => m.product_id === selectedKardexProduct.id);
                if (prodMovements.length === 0) {
                  return <EmptyState message="No hay movimientos registrados para este producto todavía." />;
                }
                return (
                  <DataTable
                    columns={["Fecha", "Tipo", "Cant.", "Stock Previo", "Stock Final", "Detalle"]}
                    rows={prodMovements.map((m) => [
                      formatDate(m.created_at),
                      m.movement_type,
                      <span
                        key={m.id}
                        style={{
                          fontWeight: 700,
                          color: m.quantity > 0 ? "#10b981" : m.quantity < 0 ? "#ef4444" : "inherit",
                        }}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : `${m.quantity}`} u.
                      </span>,
                      `${m.previous_stock} u.`,
                      `${m.current_stock} u.`,
                      m.notes || m.reference_type || "-",
                    ])}
                  />
                );
              })()}
            </div>
            <div className="modal-footer">
              <button className="secondary-button" type="button" onClick={() => setSelectedKardexProduct(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={togglingProduct !== null}
        title={togglingProduct?.active ? "Dar de baja producto" : "Reactivar producto"}
        message={
          togglingProduct?.active
            ? `¿Seguro que deseas dar de baja "${togglingProduct.name}"? No aparecerá en el Punto de Venta pero conservará su historial.`
            : `¿Deseas reactivar "${togglingProduct?.name ?? ""}" en el catálogo?`
        }
        confirmLabel={togglingProduct?.active ? "Dar de baja" : "Reactivar"}
        danger={Boolean(togglingProduct?.active)}
        loading={toggling}
        onConfirm={() => void confirmToggleActive()}
        onCancel={() => setTogglingProduct(null)}
      />
    </div>
  );
}
