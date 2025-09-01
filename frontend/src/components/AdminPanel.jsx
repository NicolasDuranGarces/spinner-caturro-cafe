import React, { useEffect, useState } from 'react';
import PromoEditRow from './PromoEditRow';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

export default function AdminPanel({ adminToken, setAdminToken, notify }) {
  const [valid, setValid] = useState(false);
  const [promos, setPromos] = useState([]);
  const [newPromo, setNewPromo] = useState({ nombre: '', descripcion: '', probabilidad: 10, activa: true, color: '#4B5563', icono: '🎁' });
  const [editing, setEditing] = useState(null);
  const [page, setPage] = useState(0);
  const [registros, setRegistros] = useState([]);
  const [loadingRegistros, setLoadingRegistros] = useState(false);
  const [addPoints, setAddPoints] = useState({ cedula: '', puntos: 0, descripcion: '' });

  const headers = adminToken ? { 'X-Admin-Token': adminToken } : {};

  // Validate token once and persist
  const validateToken = async (token) => {
    try {
      const res = await apiGet('/admin/ping', { headers: { 'X-Admin-Token': token } });
      if (res.ok) {
        setAdminToken(token);
        localStorage.setItem('adminToken', token);
        setValid(true);
        return true;
      }
    } catch {}
    return false;
  };

  useEffect(() => {
    const saved = localStorage.getItem('adminToken');
    if (saved && !valid) {
      validateToken(saved);
    }
  }, [valid]);

  const fetchPromos = async () => {
    const res = await apiGet('/promociones?activas_solo=true');
    const data = await res.json();
    setPromos(data);
  };

  const fetchRegistros = async () => {
    setLoadingRegistros(true);
    try {
      const res = await apiGet(`/registros?skip=${page * 10}&limit=10`, { headers });
      if (!res.ok) throw new Error('error');
      const data = await res.json();
      setRegistros(data);
    } catch {
      setRegistros([]);
    }
    setLoadingRegistros(false);
  };

  useEffect(() => { if (valid) fetchRegistros(); }, [valid, page]);
  useEffect(() => { fetchPromos(); }, []);

  return (
    <div className="space-y-8">
      {!valid ? (
        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
          <h2 className="text-xl font-bold text-white mb-3">Panel de Administración</h2>
          <form onSubmit={async (e) => { e.preventDefault(); const ok = await validateToken(adminToken); if (!ok) notify('Token inválido', 'error'); }} className="flex gap-3 items-center">
            <input type="password" placeholder="X-Admin-Token" value={adminToken} onChange={(e)=>setAdminToken(e.target.value)} className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 text-white w-full" />
            <button type="submit" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg">Entrar</button>
          </form>
        </div>
      ) : (
        <>
          {/* Agregar puntos */}
          <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold mb-4">Agregar puntos por compra</h3>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={async (e)=>{
              e.preventDefault();
              const res = await apiPost('/puntos/agregar', { cedula: addPoints.cedula, puntos: Number(addPoints.puntos), descripcion: addPoints.descripcion }, { headers });
              if (res.ok) { setAddPoints({ cedula: '', puntos: 0, descripcion: '' }); notify('Puntos agregados', 'success'); }
              else notify('Error agregando puntos', 'error');
            }}>
              <input type="text" value={addPoints.cedula} onChange={(e)=>setAddPoints({...addPoints, cedula: e.target.value})} placeholder="Cédula" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
              <input type="number" min="1" value={addPoints.puntos} onChange={(e)=>setAddPoints({...addPoints, puntos: e.target.value})} placeholder="Puntos" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
              <input type="text" value={addPoints.descripcion} onChange={(e)=>setAddPoints({...addPoints, descripcion: e.target.value})} placeholder="Descripción" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
              <button type="submit" className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Agregar</button>
            </form>
          </div>

          {/* Redimir puntos */}
          <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold mb-4">Redimir puntos (admin)</h3>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={async (e)=>{
              e.preventDefault();
              const res = await apiPost('/puntos/redimir', { cedula: addPoints.cedula, puntos: Number(addPoints.puntos), descripcion: addPoints.descripcion }, { headers });
              if (res.ok) { setAddPoints({ cedula: '', puntos: 0, descripcion: '' }); notify('Puntos redimidos', 'success'); }
              else notify('Error redimiendo puntos', 'error');
            }}>
              <input type="text" value={addPoints.cedula} onChange={(e)=>setAddPoints({...addPoints, cedula: e.target.value})} placeholder="Cédula" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
              <input type="number" min="1" value={addPoints.puntos} onChange={(e)=>setAddPoints({...addPoints, puntos: e.target.value})} placeholder="Puntos a restar" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
              <input type="text" value={addPoints.descripcion} onChange={(e)=>setAddPoints({...addPoints, descripcion: e.target.value})} placeholder="Descripción" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
              <button type="submit" className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Redimir</button>
            </form>
          </div>

          {/* Crear promición */}
          <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold mb-4">Crear Nueva Promoción</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded" placeholder="Nombre" value={newPromo.nombre} onChange={(e)=>setNewPromo({ ...newPromo, nombre: e.target.value })} />
              <input className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded" placeholder="Descripción" value={newPromo.descripcion} onChange={(e)=>setNewPromo({ ...newPromo, descripcion: e.target.value })} />
              <input type="number" min="0" step="0.1" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded" placeholder="Probabilidad (%)" value={newPromo.probabilidad} onChange={(e)=>setNewPromo({ ...newPromo, probabilidad: parseFloat(e.target.value || 0) })} />
              <input type="color" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded h-12" value={newPromo.color} onChange={(e)=>setNewPromo({ ...newPromo, color: e.target.value })} />
              <input className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded" placeholder="Icono (emoji)" value={newPromo.icono} onChange={(e)=>setNewPromo({ ...newPromo, icono: e.target.value })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={newPromo.activa} onChange={(e)=>setNewPromo({ ...newPromo, activa: e.target.checked })}/> Activa</label>
            </div>
            <button onClick={async ()=>{
              const res = await apiPost('/promociones', newPromo, { headers });
              if (!res.ok) { notify('Error creando promoción', 'error'); return; }
              setNewPromo({ nombre: '', descripcion: '', probabilidad: 10, activa: true, color: '#4B5563', icono: '🎁' });
              fetchPromos();
            }} className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Crear Promoción</button>
          </div>

          {/* Lista de promociones */}
          <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
            <h3 className="text-lg font-semibold mb-4">Promociones Activas ({promos.length})</h3>
            <div className="space-y-3">
              {promos.map((p) => (
                <div key={p.id} className="bg-neutral-900/60 border border-neutral-700 rounded p-3">
                  {editing === p.id ? (
                    <PromoEditRow
                      promo={p}
                      onCancel={() => setEditing(null)}
                      onSave={async (data) => {
                        const res = await apiPut(`/promociones/${p.id}`, data, { headers });
                        if (!res.ok) { notify('Error actualizando', 'error'); return; }
                        setEditing(null);
                        fetchPromos();
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: p.color }}>{p.icono}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{p.nombre}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${p.activa ? 'bg-green-700' : 'bg-red-700'}`}>{p.activa ? 'Activa' : 'Inactiva'}</span>
                          </div>
                          <div className="text-gray-400 text-sm">{p.descripcion || '—'}</div>
                          <div className="text-gray-300 text-sm">Probabilidad: {p.probabilidad}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditing(p.id)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded" title="Editar">Editar</button>
                        <button onClick={async ()=>{
                          const res = await apiDelete(`/promociones/${p.id}`, { headers });
                          if (!res.ok) { notify('Error eliminando', 'error'); return; }
                          fetchPromos();
                        }} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded" title="Eliminar">Eliminar</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Últimos giros */}
          <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800 mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Últimas Tiradas</h3>
              <div className="flex gap-2">
                <button onClick={() => { if (page > 0) setPage(page - 1); }} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded disabled:opacity-50" disabled={page===0||loadingRegistros}>← Anterior</button>
                <button onClick={() => setPage(page + 1)} className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded disabled:opacity-50" disabled={loadingRegistros || (registros.length < 10)}>Siguiente →</button>
              </div>
            </div>
            <button onClick={fetchRegistros} className="mb-3 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded" disabled={loadingRegistros || !adminToken}>Refrescar</button>
            {loadingRegistros ? (
              <div className="text-gray-400">Cargando registros...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="px-2 py-1 text-left text-gray-400">Nombre Cliente</th>
                      <th className="px-2 py-1 text-left text-gray-400">Promoción</th>
                      <th className="px-2 py-1 text-left text-gray-400">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-gray-500 py-4">Sin registros</td>
                      </tr>
                    ) : (
                      registros.map((r, idx) => (
                        <tr key={r.id || idx} className="border-b border-neutral-800">
                          <td className="px-2 py-1">{r.cliente?.nombre_completo || '-'}</td>
                          <td className="px-2 py-1">{r.promocion?.nombre || '-'}</td>
                          <td className="px-2 py-1">{r.fecha_giro ? new Date(r.fecha_giro).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
