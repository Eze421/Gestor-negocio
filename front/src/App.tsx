import { AppProviders } from "./app/AppProviders";
import { ShellLayout } from "./layouts/ShellLayout";
import { ModuleGrid } from "./features/dashboard/components/ModuleGrid";
import { moduleCards } from "./features/dashboard/data/modules";

export default function App() {
  return (
    <AppProviders>
      <ShellLayout>
        <section className="hero">
          <div>
            <p className="eyebrow">Sistema local, interfaz web</p>
            <h1>Gestor Negocio</h1>
            <p className="hero-copy">
              Reinicio completo del proyecto con una base mas limpia, modular y lista para
              crecer.
            </p>
          </div>
          <div className="hero-panel">
            <span className="hero-panel-label">Estado</span>
            <strong>Arquitectura inicial creada</strong>
            <p>Front en navegador, back local y modulos listos para desarrollarse.</p>
          </div>
        </section>

        <section className="section">
          <div className="section-heading">
            <p className="eyebrow">Modulos previstos</p>
            <h2>Base funcional</h2>
          </div>
          <ModuleGrid modules={moduleCards} />
        </section>
      </ShellLayout>
    </AppProviders>
  );
}
