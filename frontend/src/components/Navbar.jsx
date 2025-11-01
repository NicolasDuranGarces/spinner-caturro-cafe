import { Settings, LogOut } from "lucide-react";

export default function Navbar({
  view,
  puntos,
  onToggleAdmin,
  onLogout,
  ruletaTab,
  setRuletaTab,
  cliente,
  onOpenHistorial,
  isAdminAuthenticated,
}) {
  if (!cliente && !isAdminAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      {cliente && (
        <>
          {view === "ruleta" && (
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => {
                  setRuletaTab("historial");
                  onOpenHistorial?.();
                }}
                className={`px-3 py-1 rounded text-sm ${
                  ruletaTab === "historial"
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-900 border border-neutral-700 text-gray-300"
                }`}
              >
                Historial
              </button>
            </div>
          )}
          <span className="text-sm text-gray-300">
            Puntos: <strong className="text-white">{puntos}</strong>
          </span>
        </>
      )}
      {isAdminAuthenticated && (
        <button
          onClick={onToggleAdmin}
          className="p-2 rounded-lg hover:bg-neutral-800 transition"
          title="Panel Admin"
        >
          <Settings className="w-6 h-6 text-gray-300" />
        </button>
      )}
      {(cliente || isAdminAuthenticated) && (
        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-neutral-800 transition"
          title="Salir"
          aria-label="Salir"
        >
          <LogOut className="w-6 h-6 text-gray-300" />
        </button>
      )}
    </div>
  );
}
