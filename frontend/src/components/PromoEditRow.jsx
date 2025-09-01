import { useState } from 'react';
import { Save, X } from 'lucide-react';

export default function PromoEditRow({ promo, onSave, onCancel }) {
  const [f, setF] = useState({
    nombre: promo.nombre,
    descripcion: promo.descripcion || "",
    probabilidad: Number(promo.probabilidad),
    activa: promo.activa,
    color: promo.color,
    icono: promo.icono,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(f); }} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
      <input className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-white" value={f.nombre}
        onChange={e => setF({ ...f, nombre: e.target.value })} />
      <input className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-white" value={f.descripcion}
        onChange={e => setF({ ...f, descripcion: e.target.value })} />
      <input type="number" min="0" step="0.1" className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-white" value={f.probabilidad}
        onChange={e => setF({ ...f, probabilidad: parseFloat(e.target.value || 0) })} />
      <input type="color" className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded h-12" value={f.color}
        onChange={e => setF({ ...f, color: e.target.value })} />
      <input className="px-3 py-2 bg-neutral-950 border border-neutral-700 rounded text-white" value={f.icono}
        onChange={e => setF({ ...f, icono: e.target.value })} />
      <div className="flex items-center gap-2">
        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={f.activa} onChange={e => setF({ ...f, activa: e.target.checked })} />
          Activa
        </label>
        <button type="submit" className="px-3 py-2 bg-green-800 hover:bg-green-700 rounded text-white flex items-center gap-1">
          <Save className="w-4 h-4" /> Guardar
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-white flex items-center gap-1">
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </form>
  );
}

