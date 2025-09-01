export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  const cls =
    type === 'error'
      ? 'bg-red-950/60 border-red-700 text-red-100'
      : type === 'success'
      ? 'bg-green-950/60 border-green-700 text-green-100'
      : 'bg-neutral-900/60 border-neutral-700 text-gray-100';
  return (
    <div className="mb-4">
      <div className={`px-4 py-3 rounded-lg border text-sm flex items-start justify-between gap-3 w-full ${cls}`}>
        <span className="whitespace-pre-wrap break-words">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 rounded hover:bg-white/10" aria-label="Cerrar alerta">×</button>
      </div>
    </div>
  );
}

