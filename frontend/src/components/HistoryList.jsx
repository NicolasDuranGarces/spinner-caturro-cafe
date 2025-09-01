export default function HistoryList({ registros, loading }) {
  return (
    <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Historial de tiros</h2>
      </div>
      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : (
        <ul className="space-y-2">
          {registros.map((r, idx) => (
            <li key={r.id || idx} className="bg-neutral-900/60 border border-neutral-800 rounded p-3 flex justify-between">
              <span className="text-sm text-gray-300">{r.promocion?.nombre || '-'}</span>
              <span className="text-sm text-gray-400">{r.fecha_giro ? new Date(r.fecha_giro).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
            </li>
          ))}
          {!registros.length && <li className="text-gray-500">Sin tiros registrados</li>}
        </ul>
      )}
    </div>
  );
}

