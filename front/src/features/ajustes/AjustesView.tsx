import { type ChangeEvent, type FormEvent, useRef, useState } from "react";
import { API_URL, apiDownload } from "../../shared/api/client";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { Field, SubmitButton } from "../../shared/components/UI";
import { useToast } from "../../shared/context/ToastContext";
import type { BusinessSettings } from "../../shared/types/models";

type AjustesViewProps = {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  systemThemeSync: boolean;
  setSystemThemeSync: (s: boolean) => void;
  accentColor: string;
  setAccentColor: (a: string) => void;
  daltonism: string;
  setDaltonism: (d: string) => void;
  highContrast: boolean;
  setHighContrast: (h: boolean) => void;
  textScale: string;
  setTextScale: (s: string) => void;
  businessSettings: BusinessSettings;
  onSaveBusinessSettings: (settings: BusinessSettings) => void;
  onDatabaseRestored: () => void;
};

export function AjustesView({
  theme,
  setTheme,
  systemThemeSync,
  setSystemThemeSync,
  accentColor,
  setAccentColor,
  daltonism,
  setDaltonism,
  highContrast,
  setHighContrast,
  textScale,
  setTextScale,
  businessSettings,
  onSaveBusinessSettings,
  onDatabaseRestored,
}: AjustesViewProps) {
  const { showToast } = useToast();
  const [bizForm, setBizForm] = useState<BusinessSettings>(businessSettings);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBusiness = (e: FormEvent) => {
    e.preventDefault();
    onSaveBusinessSettings(bizForm);
    showToast("Datos del comercio guardados para los tickets", "success");
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const stamp = new Date().toISOString().slice(0, 10);
      await apiDownload("/system/backup", `gestock_backup_${stamp}.db`);
      showToast("Copia de seguridad descargada", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo descargar el backup", "error");
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleSelectRestoreFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingRestoreFile(file);
    }
  };

  const confirmRestoreBackup = async () => {
    if (!pendingRestoreFile) return;
    setRestoringBackup(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingRestoreFile);
      const response = await fetch(`${API_URL}/system/restore`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || "Error al restaurar la base de datos");
      }
      setPendingRestoreFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("Base de datos restaurada correctamente", "success");
      onDatabaseRestored();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "No se pudo restaurar el respaldo", "error");
      setPendingRestoreFile(null);
    } finally {
      setRestoringBackup(false);
    }
  };

  return (
    <div className="pos-container">
      <div className="stack">
        <div className="panel">
          <h3 style={{ marginBottom: "20px" }}>Visualización y Accesibilidad</h3>

          <div className="settings-group">
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Tema Visual</label>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                className={`secondary-button ${theme === "light" && !systemThemeSync ? "active" : ""}`}
                style={{ borderColor: theme === "light" && !systemThemeSync ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => {
                  setSystemThemeSync(false);
                  setTheme("light");
                }}
                type="button"
              >
                Claro
              </button>
              <button
                className={`secondary-button ${theme === "dark" && !systemThemeSync ? "active" : ""}`}
                style={{ borderColor: theme === "dark" && !systemThemeSync ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => {
                  setSystemThemeSync(false);
                  setTheme("dark");
                }}
                type="button"
              >
                Oscuro
              </button>
              <button
                className={`secondary-button ${systemThemeSync ? "active" : ""}`}
                style={{ borderColor: systemThemeSync ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setSystemThemeSync(true)}
                type="button"
              >
                Sincronizar con Sistema
              </button>
            </div>
          </div>

          <div className="settings-group" style={{ marginTop: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Color de Acento (Identidad)</label>
            <select value={accentColor} onChange={(e) => setAccentColor(e.target.value)}>
              <option value="gestock-blue">Azul GESTOCK (Original)</option>
              <option value="emerald-green">Verde Esmeralda</option>
              <option value="purple">Púrpura Vibrante</option>
              <option value="orange">Naranja Intenso</option>
            </select>
          </div>

          <div className="settings-group" style={{ marginTop: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Filtro de Contraste para Daltonismo</label>
            <select value={daltonism} onChange={(e) => setDaltonism(e.target.value)}>
              <option value="none">Sin corrección (Por defecto)</option>
              <option value="deutan">Deuteranopía (Verde/Rojo suave)</option>
              <option value="protan">Protanopía (Rojo/Verde suave)</option>
              <option value="tritan">Tritanopía (Azul/Amarillo suave)</option>
            </select>
          </div>

          <div className="settings-group" style={{ marginTop: "24px", display: "flex", gap: "24px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              Modo Alto Contraste (Realzar Bordes y Legibilidad)
            </label>
          </div>

          <div className="settings-group" style={{ marginTop: "24px" }}>
            <label style={{ fontWeight: 700, display: "block", marginBottom: "8px" }}>Escala del Texto General</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="secondary-button"
                style={{ borderColor: textScale === "small" ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setTextScale("small")}
                type="button"
              >
                Pequeño
              </button>
              <button
                className="secondary-button"
                style={{ borderColor: textScale === "normal" ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setTextScale("normal")}
                type="button"
              >
                Normal
              </button>
              <button
                className="secondary-button"
                style={{ borderColor: textScale === "large" ? "var(--color-primary)" : "var(--border-color)" }}
                onClick={() => setTextScale("large")}
                type="button"
              >
                Grande
              </button>
            </div>
          </div>
        </div>

        <form className="panel" onSubmit={handleSaveBusiness}>
          <h3 style={{ marginBottom: "16px" }}>Membrete de Tickets y Comprobantes</h3>
          <div className="form-row">
            <Field label="Nombre del Comercio">
              <input
                value={bizForm.name}
                onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                placeholder="Ej. Almacén Don Pepe"
              />
            </Field>
            <Field label="Subtítulo / Rubro">
              <input
                value={bizForm.subtitle}
                onChange={(e) => setBizForm({ ...bizForm, subtitle: e.target.value })}
                placeholder="Ej. Kiosco y Despensa"
              />
            </Field>
          </div>
          <div className="form-row">
            <Field label="CUIT / RUT / Identificador Fiscal">
              <input
                value={bizForm.taxId}
                onChange={(e) => setBizForm({ ...bizForm, taxId: e.target.value })}
                placeholder="Ej. 20-12345678-9"
              />
            </Field>
            <Field label="Teléfono">
              <input
                value={bizForm.phone}
                onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                placeholder="Ej. 11-4455-6677"
              />
            </Field>
          </div>
          <Field label="Dirección">
            <input
              value={bizForm.address}
              onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
              placeholder="Ej. Av. San Martín 1234"
            />
          </Field>
          <Field label="Mensaje al pie del ticket">
            <input
              value={bizForm.footerMessage}
              onChange={(e) => setBizForm({ ...bizForm, footerMessage: e.target.value })}
              placeholder="Ej. ¡Gracias por su compra!"
            />
          </Field>
          <div style={{ marginTop: "12px" }}>
            <SubmitButton label="Guardar Datos del Comercio" saving={false} />
          </div>
        </form>
      </div>

      <div className="stack">
        <div className="panel" style={{ padding: "20px" }}>
          <h4>Respaldo y Restauración (SQLite)</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "8px", lineHeight: "1.4" }}>
            Descarga una copia completa de tu base de datos local para resguardarla, o restaura una copia previa en caso
            de necesitar recuperar información.
          </p>
          <div className="stack" style={{ gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              className="primary-button"
              disabled={downloadingBackup}
              onClick={() => void handleDownloadBackup()}
            >
              {downloadingBackup ? "Generando Backup..." : "⬇ Descargar Copia de Seguridad (.db)"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              style={{ display: "none" }}
              onChange={handleSelectRestoreFile}
            />
            <button
              type="button"
              className="secondary-button"
              onClick={() => fileInputRef.current?.click()}
            >
              ⬆ Restaurar desde Archivo (.db)
            </button>
          </div>
        </div>

        <div className="panel" style={{ padding: "20px" }}>
          <h4>Información de Accesibilidad</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "10px", lineHeight: "1.4" }}>
            La configuración de GESTOCK cumple con las pautas de accesibilidad para herramientas operativas comerciales.
            El modo de alto contraste y los preajustes de daltonismo están orientados a mejorar la lectura en pantallas
            táctiles y entornos con luz variable.
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={pendingRestoreFile !== null}
        title="Restaurar Base de Datos"
        message={`¿Seguro que deseas reemplazar la base de datos actual con "${pendingRestoreFile?.name ?? ""}"? Se guardará una copia de seguridad previa automática.`}
        confirmLabel="Restaurar Base de Datos"
        danger
        loading={restoringBackup}
        onConfirm={() => void confirmRestoreBackup()}
        onCancel={() => {
          setPendingRestoreFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
    </div>
  );
}
