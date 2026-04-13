import type { ModuleCardItem } from "../types";

type ModuleGridProps = {
  modules: ModuleCardItem[];
};

export function ModuleGrid({ modules }: ModuleGridProps) {
  return (
    <div className="module-grid">
      {modules.map((module) => (
        <article className="module-card" key={module.key} id={module.key}>
          <div className="module-card-header">
            <span>{module.status}</span>
            <strong>{module.name}</strong>
          </div>
          <p>{module.description}</p>
        </article>
      ))}
    </div>
  );
}
