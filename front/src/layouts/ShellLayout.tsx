import type { PropsWithChildren } from "react";

export function ShellLayout({ children }: PropsWithChildren) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="brand-kicker">GN</p>
          <h2>Gestor Negocio</h2>
          <p className="sidebar-copy">Aplicacion local para administrar ventas, caja e inventario.</p>
        </div>

        <nav className="sidebar-nav" aria-label="Navegacion principal">
          <a href="#dashboard">Dashboard</a>
          <a href="#ventas">Ventas</a>
          <a href="#inventario">Inventario</a>
          <a href="#clientes">Clientes</a>
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
