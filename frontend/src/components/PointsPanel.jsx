export default function PointsPanel({ puntos, movimientos }) {
  return (
    <div>
      <div className="mb-6 text-center">
        <p className="text-gray-300">Puntos disponibles: <span className="font-bold text-white">{puntos}</span></p>
      </div>
      <div className="max-w-md mx-auto text-center text-gray-400">
        Redención de puntos disponible solo en el punto físico.
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Historial de movimientos</h3>
        <ul className="space-y-2 text-sm">
          {movimientos.map((m) => (
            <li key={m.id} className="flex justify-between bg-neutral-900/60 border border-neutral-800 rounded px-3 py-2">
              <span>{new Date(m.created_at).toLocaleString()}</span>
              <span className={m.cambio >= 0 ? 'text-green-400' : 'text-red-400'}>{m.cambio >= 0 ? '+' : ''}{m.cambio}</span>
              <span className="text-gray-400">{m.descripcion}</span>
            </li>
          ))}
          {!movimientos.length && <li className="text-gray-500">Sin movimientos</li>}
        </ul>
      </div>
    </div>
  );
}

