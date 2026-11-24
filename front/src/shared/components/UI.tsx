import { useEffect, useState, type ReactNode } from "react";
import type { Loadable } from "../types/models";

export function MetricCard({
  label,
  meta,
  value,
  icon,
}: {
  label: string;
  meta: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <article className="metric-card">
      <div className="metric-header">
        <span>{label}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <strong>{value}</strong>
      <p>{meta}</p>
    </article>
  );
}

export function Panel<T>({
  children,
  state,
  title,
  actions,
}: {
  children: ReactNode;
  state?: Loadable<T>;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h3>{title}</h3>
          {state?.loading ? <span className="loading-pill">Cargando...</span> : null}
        </div>
        {actions ? <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>{actions}</div> : null}
      </div>
      {state?.error ? (
        <EmptyState message={`No se pudo cargar: ${state.error}`} />
      ) : state?.loading && Array.isArray(state.data) && state.data.length === 0 ? (
        <div className="skeleton-stack" aria-busy="true">
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export function DataTable({
  columns,
  rows,
  pageSize = 25,
  emptyMessage = "Todavía no hay datos para mostrar.",
}: {
  columns: string[];
  rows: (string | ReactNode)[][];
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [rows.length, page, totalPages]);

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const startIndex = (page - 1) * pageSize;
  const visibleRows = pageSize > 0 ? rows.slice(startIndex, startIndex + pageSize) : rows;

  const renderCell = (cell: string | ReactNode) => {
    if (typeof cell !== "string") {
      return cell;
    }
    const trimmed = cell.trim();
    if (trimmed === "Pagada" || trimmed === "Activo" || trimmed === "Cuadrada") {
      return <span className="badge badge-success">{trimmed}</span>;
    }
    if (trimmed === "Pendiente" || trimmed === "Parcial" || trimmed === "A Pagar") {
      return <span className="badge badge-warning">{trimmed}</span>;
    }
    if (trimmed === "Inactivo" || trimmed === "Anulada" || trimmed.startsWith("Faltante")) {
      return <span className="badge badge-danger">{trimmed}</span>;
    }
    if (trimmed.startsWith("Sobrante")) {
      return (
        <span
          className="badge badge-success"
          style={{ background: "var(--badge-success-bg)", color: "var(--badge-success-text)" }}
        >
          {trimmed}
        </span>
      );
    }
    if (trimmed === "Sin categoria" || trimmed === "Sin categoría" || trimmed === "-") {
      return <span className="badge badge-neutral">{trimmed}</span>;
    }
    return cell;
  };

  return (
    <div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={startIndex + rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>{renderCell(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Mostrando {startIndex + 1}–{Math.min(startIndex + pageSize, rows.length)} de {rows.length} registros
          </span>
          <div className="pagination-controls">
            <button
              type="button"
              className="secondary-button pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹ Anterior
            </button>
            <span className="pagination-page">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              className="secondary-button pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function SubmitButton({ label, saving }: { label: string; saving: boolean }) {
  return (
    <button className="primary-button" disabled={saving} type="submit">
      {saving ? "Guardando..." : label}
    </button>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="empty-state">{message}</p>;
}
