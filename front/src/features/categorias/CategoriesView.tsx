import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { apiDelete, apiPatch, apiPost } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { DataTable, Field, Panel, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { Category, Loadable } from "../../shared/types/models";

export function CategoriesView({
  categories,
  onCreated,
}: {
  categories: Loadable<Category[]>;
  onCreated: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const parentCategories = useMemo(() => {
    return categories.data.filter((c) => !c.name.includes(" > "));
  }, [categories.data]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let finalName = name.trim();
      if (parentId) {
        const parent = parentCategories.find((c) => c.id === Number(parentId));
        if (parent) {
          finalName = `${parent.name} > ${finalName}`;
        }
      }
      await apiPost<Category>("/categories/", { name: finalName });
      setName("");
      setParentId("");
      showToast("Categoría registrada con éxito", "success");
      onCreated();
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "No se pudo crear la categoría";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editName.trim()) return;
    setSavingEdit(true);
    try {
      await apiPatch<Category>(`/categories/${editingCategory.id}`, { name: editName.trim() });
      setEditingCategory(null);
      showToast("Categoría actualizada", "success");
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo actualizar la categoría", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await apiDelete(`/categories/${deletingCategory.id}`);
      setDeletingCategory(null);
      showToast("Categoría eliminada", "success");
      onCreated();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo eliminar la categoría", "error");
      setDeletingCategory(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="work-grid">
      <Panel title="Categorías" state={categories}>
        <DataTable
          columns={["ID", "Nombre / Jerarquía", "Acciones"]}
          rows={categories.data.map((category) => [
            category.id.toString(),
            category.name,
            <div style={{ display: "flex", gap: "6px" }} key={category.id}>
              <button
                type="button"
                className="secondary-button action-btn-sm"
                onClick={() => openEdit(category)}
              >
                Editar
              </button>
              {category.name.toLowerCase() !== "sin categoria" && (
                <button
                  type="button"
                  className="secondary-button action-btn-sm"
                  style={{ color: "#ef4444" }}
                  onClick={() => setDeletingCategory(category)}
                >
                  Eliminar
                </button>
              )}
            </div>,
          ])}
        />
      </Panel>

      <form className="form-panel" onSubmit={(event) => void submit(event)}>
        <h3>Nueva categoría</h3>
        <Field label="Nombre de Categoría">
          <input ref={nameInputRef} required value={name} onChange={(event) => setName(event.target.value)} />
        </Field>

        <Field label="Categoría Padre (Opcional)">
          <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">Ninguna (Sería categoría principal)</option>
            {parentCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <SubmitButton label="Crear categoría" saving={saving} />
        {error ? <p className="form-error">{error}</p> : null}
      </form>

      {editingCategory && (
        <div className="modal-backdrop" onClick={() => setEditingCategory(null)}>
          <div className="modal-content" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Categoría</h3>
              <button className="close-button" type="button" onClick={() => setEditingCategory(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={(e) => void submitEdit(e)}>
              <div className="modal-body">
                <Field label="Nombre / Jerarquía">
                  <input required value={editName} onChange={(e) => setEditName(e.target.value)} />
                </Field>
              </div>
              <div className="modal-footer">
                <button className="secondary-button" type="button" onClick={() => setEditingCategory(null)}>
                  Cancelar
                </button>
                <SubmitButton label="Guardar Cambios" saving={savingEdit} />
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingCategory !== null}
        title="Eliminar Categoría"
        message={`¿Seguro que deseas eliminar la categoría "${deletingCategory?.name ?? ""}"? Solo es posible si no tiene productos asignados.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeletingCategory(null)}
      />
    </section>
  );
}
