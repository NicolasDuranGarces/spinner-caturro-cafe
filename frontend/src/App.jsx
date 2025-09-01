import React, { useEffect, useMemo, useState } from "react";
import { Coffee, Gift, RotateCcw, Settings, X, LogOut } from "lucide-react";
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import RouletteWheel from './components/RouletteWheel';
import PointsPanel from './components/PointsPanel';
import HistoryList from './components/HistoryList';
import AdminPanel from './components/AdminPanel';
import AuthForm from './components/AuthForm';
import { apiGet, apiPost } from './lib/api';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
    const [view, setView] = useState("register"); // register | ruleta | admin
    const [cliente, setCliente] = useState(null);
    const [authMode, setAuthMode] = useState("login"); // login | register
    const [authForm, setAuthForm] = useState({ cedula: "", password: "", nombre_completo: "", semestre: "" });
    const [puntos, setPuntos] = useState(0);
    const [historial, setHistorial] = useState([]);
    const [redeem, setRedeem] = useState({ puntos: 0, password: "", descripcion: "" });

    const [promos, setPromos] = useState([]);
    const [loadingPromos, setLoadingPromos] = useState(false);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [ruletaResult, setRuletaResult] = useState(null);
    const [ruletaTab, setRuletaTab] = useState('puntos'); // puntos | historial

    const [adminToken, setAdminToken] = useState("");
    const [editing, setEditing] = useState(null);
    const [newPromo, setNewPromo] = useState({
        nombre: "",
        descripcion: "",
        probabilidad: 10,
        activa: true,
        color: "#4B5563",
        icono: "🎁",
    });
    // Admin access password state
    const [adminPass, setAdminPass] = useState("");
    const [hasEnteredPass, setHasEnteredPass] = useState(false);

    // Toast / alertas en-app
    const [toast, setToast] = useState(null); // { message, type }
    const notify = (message, type = 'info', timeout = 3500) => {
        setToast({ message, type });
        if (timeout) {
            window.clearTimeout(notify._t);
            notify._t = window.setTimeout(() => setToast(null), timeout);
        }
    };

    // Util para leer mensajes de error sin mostrar JSON crudo
    const readErrorMessage = async (res, fallback = 'Ocurrió un error') => {
        try {
            const data = await res.clone().json();
            if (typeof data?.detail === 'string') return data.detail;
            if (Array.isArray(data?.detail)) {
                return data.detail.map((d) => d?.msg || d).join(', ');
            }
            if (typeof data?.message === 'string') return data.message;
        } catch (_) {
            try {
                const t = await res.text();
                const trimmed = (t || '').trim();
                if (!trimmed) return fallback;
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) return fallback;
                return trimmed;
            } catch (_) {
                return fallback;
            }
        }
        return fallback;
    };

    // Estado para registros (últimas tiradas)
    const [registros, setRegistros] = useState([]);
    const [loadingRegistros, setLoadingRegistros] = useState(false);
    const [misRegistros, setMisRegistros] = useState([]);
    const [loadingMisRegistros, setLoadingMisRegistros] = useState(false);
    const [page, setPage] = useState(0);

    // Función para obtener registros
    const fetchRegistros = async () => {
        setLoadingRegistros(true);
        try {
            const res = await apiGet(`/registros?skip=${page * 10}&limit=10`, { headers: { 'X-Admin-Token': adminToken } });
            if (!res.ok) throw new Error("Error al cargar registros");
            const data = await res.json();
            setRegistros(data);
        } catch (e) {
            setRegistros([]);
        }
        setLoadingRegistros(false);
    };

    // Admin: agregar puntos por cédula
    const [addPoints, setAddPoints] = useState({ cedula: "", puntos: 0, descripcion: "" });

    // cargar promociones activas
    const fetchPromos = async () => {
        setLoadingPromos(true);
        const res = await apiGet(`/promociones?activas_solo=true`);
        const data = await res.json();
        setPromos(data);
        setLoadingPromos(false);
    };

    useEffect(() => {
        if (view !== "admin") fetchPromos();
    }, [view]);

    // Restaurar sesión del cliente
    useEffect(() => {
        const raw = localStorage.getItem("cliente");
        if (raw) {
            try {
                const c = JSON.parse(raw);
                setCliente(c);
                setView("ruleta");
            } catch {}
        }
    }, []);

    const fetchPuntos = async (cid) => {
        if (!cid) return;
        try {
            const res = await fetch(`${API_URL}/clientes/${cid}/puntos`);
            if (res.ok) {
                const data = await res.json();
                setPuntos(data.puntos);
                setHistorial(data.historial || []);
            }
        } catch {}
    };

    const fetchMisRegistros = async (cid) => {
        if (!cid) return;
        setLoadingMisRegistros(true);
        try {
            const res = await fetch(`${API_URL}/clientes/${cid}/registros?limit=50`);
            if (res.ok) {
                const data = await res.json();
                setMisRegistros(data);
            }
        } catch {}
        setLoadingMisRegistros(false);
    };

    // Cargar registros cuando adminToken y page cambian
    useEffect(() => {
        if (view === "admin" && adminToken) {
            fetchRegistros();
        }
        // eslint-disable-next-line
    }, [view, adminToken, page]);

    // Actualizar puntos cuando hay cliente
    useEffect(() => {
        if (cliente?.id) fetchPuntos(cliente.id);
    }, [cliente?.id]);

    useEffect(() => {
        if (ruletaTab === 'historial' && cliente?.id) {
            fetchMisRegistros(cliente.id);
        }
    }, [ruletaTab, cliente?.id]);

    // Handlers y UI de auth movidos a AuthForm

    const logout = () => {
        setCliente(null);
        setPuntos(0);
        setHistorial([]);
        localStorage.removeItem("cliente");
        setView("register");
    };

    const spin = async () => {
        if (!cliente || !promos.length || isSpinning) return;
        // Check if device already spun in the last 2 days
        const lastSpin = localStorage.getItem("lastSpinTimestamp");
        if (lastSpin) {
            const twoDays = 2 * 24 * 60 * 60 * 1000; // 2 días en ms
            const now = Date.now();
            if (now - parseInt(lastSpin, 10) < twoDays) {
                notify("Solo puedes girar una vez cada 2 días en este dispositivo.", 'error');
                return;
            }
        }
        setRuletaResult(null);
        setIsSpinning(true);

        try {
            // Get Colombia current time as ISO-like string in Colombia timezone
            const colombiaNow = new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" });
            // pedir resultado al backend, enviando fecha_giro
            const res = await fetch(`${API_URL}/ruleta/${cliente.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fecha_giro: colombiaNow }),
            });
            const data = await res.json();

            // Guardar timestamp del giro
            localStorage.setItem("lastSpinTimestamp", Date.now().toString());

            const total = promos.reduce((s, p) => s + Number(p.probabilidad), 0);
            let acc = 0;
            let winningIndex = -1;
            let winningStart = 0;
            let winningEnd = 0;
            for (let i = 0; i < promos.length; i++) {
                const p = promos[i];
                const start = (acc / total) * 360;
                acc += Number(p.probabilidad);
                const end = (acc / total) * 360;
                if (data.promocion && p.id === data.promocion.id) {
                    winningIndex = i;
                    winningStart = start;
                    winningEnd = end;
                }
            }

            const midpointAngle = (winningStart + winningEnd) / 2;

            const extraTurns = 4 + Math.floor(Math.random() * 3); // 4-6 vueltas

            const targetRotation = extraTurns * 360 + (360 - midpointAngle);
            setRotation((prev) => prev + (targetRotation - (prev % 360)));

            setTimeout(() => {
                setRuletaResult(data);
                setIsSpinning(false);
                fetchPromos();
            }, 3000);
        } catch (e) {
            setIsSpinning(false);
            notify("No se pudo girar la ruleta", 'error');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-gray-200">
            {/* Header */}
            <header className="bg-black/40 border-b border-neutral-800 p-5">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo Caturro Café" className="w-12 h-12 rounded-full object-cover" />
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-wide">CATURRO CAFÉ</h1>
                            <p className="text-sm text-gray-400">Underground Experience</p>
                        </div>
                    </div>
                    <Navbar
                      view={view}
                      puntos={puntos}
                      onToggleAdmin={() => setView(view === 'admin' ? 'ruleta' : 'admin')}
                      onLogout={logout}
                      ruletaTab={ruletaTab}
                      setRuletaTab={setRuletaTab}
                      cliente={cliente}
                      onOpenHistorial={() => fetchMisRegistros(cliente?.id)}
                    />
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {/* Alert inline (no flotante) */}
                {toast && (
                    <div className="mb-4">
                        <div className={`px-4 py-3 rounded-lg border text-sm flex items-start justify-between gap-3 w-full ${
                            toast.type === 'error' ? 'bg-red-950/60 border-red-700 text-red-100' : toast.type === 'success' ? 'bg-green-950/60 border-green-700 text-green-100' : 'bg-neutral-900/60 border-neutral-700 text-gray-100'
                        }`}>
                            <span className="whitespace-pre-wrap break-words">{toast.message}</span>
                            <button onClick={() => setToast(null)} className="ml-2 p-1 rounded hover:bg-white/10" aria-label="Cerrar alerta"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
                {view === "register" && (
                    <AuthForm
                      mode={authMode}
                      setMode={setAuthMode}
                      values={authForm}
                      setValues={setAuthForm}
                      onLogin={async ({ cedula, password }) => {
                        const res = await apiPost('/auth/login', { cedula, password });
                        if (!res.ok) { notify('Credenciales inválidas', 'error'); return; }
                        const data = await res.json();
                        setCliente(data);
                        localStorage.setItem('cliente', JSON.stringify(data));
                        setView('ruleta');
                        fetchPuntos(data.id);
                      }}
                      onRegister={async (payload) => {
                        const res = await apiPost('/auth/register', payload);
                        if (!res.ok) {
                          const msg = res.status === 409 ? 'Cédula ya registrada' : 'No se pudo registrar';
                          notify(`Error registrando cliente: ${msg}`, 'error');
                          return;
                        }
                        const data = await res.json();
                        setCliente(data);
                        localStorage.setItem('cliente', JSON.stringify(data));
                        setView('ruleta');
                        fetchPuntos(data.id);
                      }}
                    />
                )}

                {view === "ruleta" && (
                    <div className="space-y-8">
                        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800 text-center">
                            <h2 className="text-2xl font-bold">¡Bienvenido, {cliente?.nombre_completo}! 🎭</h2>
                            <p className="text-gray-400">Gira la ruleta y descubre tu premio</p>
                        </div>

                        <div className="bg-black/30 rounded-2xl p-8 border border-neutral-800">
                            <RouletteWheel promos={promos} isSpinning={isSpinning} rotation={rotation} onSpin={spin} />
                        </div>

                        {ruletaResult && (
                            <div className="bg-black/30 rounded-2xl p-8 border border-neutral-800 text-center">

                                <h3 className="text-3xl font-bold mb-2 text-white">¡{ruletaResult.promocion.nombre}!</h3>
                                {ruletaResult.promocion.descripcion && (
                                    <p className="text-gray-300 mb-2">{ruletaResult.promocion.descripcion}</p>
                                )}
                                <p className="text-gray-100 font-semibold">{ruletaResult.mensaje}</p>

                                <button
                                    onClick={() => {
                                        setRuletaResult(null);
                                        setView("ruleta");
                                        // Mantener sesión del cliente
                                    }}
                                    className="mt-6 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold"
                                    >
                                    Seguir jugando 🎲
                                    </button>
                            
                            </div>
                        )}

                        {ruletaTab === 'historial' && (
                            <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white">Historial de tiros</h2>
                                    <button onClick={() => setRuletaTab('puntos')} className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Ver puntos</button>
                                </div>
                                {loadingMisRegistros ? (
                                    <p className="text-gray-500">Cargando...</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {misRegistros.map((r, idx) => (
                                            <li key={r.id || idx} className="bg-neutral-900/60 border border-neutral-800 rounded p-3 flex justify-between">
                                                <span className="text-sm text-gray-300">{r.promocion?.nombre || '-'}</span>
                                                <span className="text-sm text-gray-400">{r.fecha_giro ? new Date(r.fecha_giro).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                                            </li>
                                        ))}
                                        {!misRegistros.length && <li className="text-gray-500">Sin tiros registrados</li>}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {view === "admin" && (
                    <div className="space-y-8">
                        {/* Acceso admin */}
                        {!hasEnteredPass ? (
                            <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
                                <h2 className="text-xl font-bold text-white mb-3">Panel de Administración</h2>
                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        if (adminPass === "2320") {
                                            setHasEnteredPass(true);
                                            setAdminPass("");
                                        } else {
                                            notify("Contraseña incorrecta", 'error');
                                            setAdminPass("");
                                        }
                                    }}
                                    className="flex gap-3 items-center"
                                >
                                    <input
                                        type="password"
                                        placeholder="Contraseña de acceso"
                                        value={adminPass}
                                        onChange={e => setAdminPass(e.target.value)}
                                        className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 text-white w-full"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
                                    >
                                        Entrar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setView("ruleta")}
                                        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
                                    >
                                        ← Volver
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <>
                                <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
                                    <h2 className="text-xl font-bold text-white mb-3">Panel de Administración</h2>
                                    <div className="flex gap-3 items-center">
                                        <input
                                            type="password"
                                            placeholder="X-Admin-Token"
                                            value={adminToken}
                                            onChange={(e) => setAdminToken(e.target.value)}
                                            className="px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 text-white w-full"
                                        />
                                        <button
                                            onClick={() => fetchPromos()}
                                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
                                        >
                                            Refrescar
                                        </button>
                                        <button
                                            onClick={() => setView("ruleta")}
                                            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
                                        >
                                            ← Volver
                                        </button>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-2">Usa el token configurado en <code>ADMIN_TOKEN</code> (docker-compose).</p>
                                </div>
                                {adminToken && (
                                    <>
                                        {/* Agregar puntos por compra */}
                                        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
                                            <h3 className="text-lg font-semibold mb-4">Agregar puntos por compra</h3>
                                            <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={async (e)=>{
                                                e.preventDefault();
                                                const res = await fetch(`${API_URL}/puntos/agregar`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
                                                    body: JSON.stringify({ cedula: addPoints.cedula, puntos: Number(addPoints.puntos), descripcion: addPoints.descripcion })
                                                });
                                        if (res.ok) {
                                            setAddPoints({ cedula: '', puntos: 0, descripcion: '' });
                                            if (cliente) fetchPuntos(cliente.id);
                                        } else {
                                            notify('Error agregando puntos', 'error');
                                        }
                                            }}>
                                                <input type="text" value={addPoints.cedula} onChange={(e)=>setAddPoints({...addPoints, cedula: e.target.value})} placeholder="Cédula" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
                                                <input type="number" min="1" value={addPoints.puntos} onChange={(e)=>setAddPoints({...addPoints, puntos: e.target.value})} placeholder="Puntos" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
                                                <input type="text" value={addPoints.descripcion} onChange={(e)=>setAddPoints({...addPoints, descripcion: e.target.value})} placeholder="Descripción" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
                                                <button type="submit" className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Agregar</button>
                                            </form>
                                        </div>

                                        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
                                            <h3 className="text-lg font-semibold mb-4">Redimir puntos (admin)</h3>
                                            <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={async (e)=>{
                                                e.preventDefault();
                                                const res = await fetch(`${API_URL}/puntos/redimir`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
                                                    body: JSON.stringify({ cedula: addPoints.cedula, puntos: Number(addPoints.puntos), descripcion: addPoints.descripcion })
                                                });
                                                if (res.ok) {
                                                    setAddPoints({ cedula: '', puntos: 0, descripcion: '' });
                                                    if (cliente) fetchPuntos(cliente.id);
                                                } else {
                                                    notify('Error redimiendo puntos', 'error');
                                                }
                                            }}>
                                                <input type="text" value={addPoints.cedula} onChange={(e)=>setAddPoints({...addPoints, cedula: e.target.value})} placeholder="Cédula" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
                                                <input type="number" min="1" value={addPoints.puntos} onChange={(e)=>setAddPoints({...addPoints, puntos: e.target.value})} placeholder="Puntos a restar" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
                                                <input type="text" value={addPoints.descripcion} onChange={(e)=>setAddPoints({...addPoints, descripcion: e.target.value})} placeholder="Descripción" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-white" />
                                                <button type="submit" className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded">Redimir</button>
                                            </form>
                                        </div>
                                        {/* Crear nueva promoción */}
                                        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800">
                                            <h3 className="text-lg font-semibold mb-4">Crear Nueva Promoción</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
                                                    placeholder="Nombre" value={newPromo.nombre}
                                                    onChange={(e) => setNewPromo({ ...newPromo, nombre: e.target.value })} />
                                                <input className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
                                                    placeholder="Descripción" value={newPromo.descripcion}
                                                    onChange={(e) => setNewPromo({ ...newPromo, descripcion: e.target.value })} />
                                                <input type="number" min="0" step="0.1" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
                                                    placeholder="Probabilidad (%)" value={newPromo.probabilidad}
                                                    onChange={(e) => setNewPromo({ ...newPromo, probabilidad: parseFloat(e.target.value || 0) })} />
                                                <input type="color" className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded h-12"
                                                    value={newPromo.color} onChange={(e) => setNewPromo({ ...newPromo, color: e.target.value })} />
                                                <input className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded"
                                                    placeholder="Icono (emoji)" value={newPromo.icono}
                                                    onChange={(e) => setNewPromo({ ...newPromo, icono: e.target.value })} />
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" checked={newPromo.activa}
                                                        onChange={(e) => setNewPromo({ ...newPromo, activa: e.target.checked })} />
                                                    Activa
                                                </label>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`${API_URL}/promociones`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken },
                                                        body: JSON.stringify(newPromo),
                                                    });
                                                    if (!res.ok) { notify("Error creando promoción", 'error'); return; }
                                                    setNewPromo({ nombre: "", descripcion: "", probabilidad: 10, activa: true, color: "#4B5563", icono: "🎁" });
                                                    fetchPromos();
                                                }}
                                                className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded"
                                            >
                                                Crear Promoción
                                            </button>
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
                                                                    const res = await fetch(`${API_URL}/promociones/${p.id}`, {
                                                                        method: "PUT",
                                                                        headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken },
                                                                        body: JSON.stringify(data),
                                                                    });
                                                                    if (!res.ok) { notify("Error actualizando", 'error'); return; }
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
                                                                            <span className={`text-xs px-2 py-0.5 rounded ${p.activa ? "bg-green-700" : "bg-red-700"}`}>
                                                                                {p.activa ? "Activa" : "Inactiva"}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-gray-400 text-sm">{p.descripcion || "—"}</div>
                                                                        <div className="text-gray-300 text-sm">Probabilidad: {p.probabilidad}%</div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => setEditing(p.id)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded" title="Editar">
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (!confirm("¿Eliminar promoción?")) return;
                                                                            const res = await fetch(`${API_URL}/promociones/${p.id}`, {
                                                                                method: "DELETE",
                                                                                headers: { "X-Admin-Token": adminToken }
                                                                            });
                                                                    if (!res.ok) { notify("Error eliminando", 'error'); return; }
                                                                            fetchPromos();
                                                                        }}
                                                                        className="p-2 bg-red-800 hover:bg-red-700 rounded"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Últimas Tiradas */}
                                        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800 mt-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-semibold">Últimas Tiradas</h3>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (page > 0) setPage(page - 1);
                                                        }}
                                                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded disabled:opacity-50"
                                                        disabled={page === 0 || loadingRegistros}
                                                    >
                                                        ← Anterior
                                                    </button>
                                                    <button
                                                        onClick={() => setPage(page + 1)}
                                                        className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded disabled:opacity-50"
                                                        disabled={loadingRegistros || (registros.length < 10)}
                                                    >
                                                        Siguiente →
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={fetchRegistros}
                                                className="mb-3 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded"
                                                disabled={loadingRegistros || !adminToken}
                                            >
                                                Refrescar
                                            </button>
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
                                                                        <td className="px-2 py-1">{r.cliente?.nombre_completo || "-"}</td>
                                                                        <td className="px-2 py-1">{r.promocion?.nombre || "-"}</td>
                                                                        <td className="px-2 py-1">
                                                                            {r.fecha_giro
                                                                                ? new Date(r.fecha_giro).toLocaleString("es-CO", {
                                                                                    dateStyle: "short",
                                                                                    timeStyle: "short"
                                                                                })
                                                                                : "-"}
                                                                        </td>
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
                            </>
                        )}
                    </div>
                )}

                
            </main>
        </div>
    );
}

function EditRow({ promo, onSave, onCancel }) {
    const [f, setF] = useState({
        nombre: promo.nombre,
        descripcion: promo.descripcion || "",
        probabilidad: Number(promo.probabilidad),
        activa: promo.activa,
        color: promo.color,
        icono: promo.icono,
    });
    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSave(f); }}
            className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center"
        >
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
