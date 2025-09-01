import React, { useEffect, useMemo, useState } from "react";
import { Coffee, Gift, RotateCcw, Settings, Trash2, Edit3, Save, X, User, Zap } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
    const [view, setView] = useState("register"); // register | ruleta | admin
    const [cliente, setCliente] = useState(null);
    const [form, setForm] = useState({ nombre_completo: "", semestre: "" });

    const [promos, setPromos] = useState([]);
    const [loadingPromos, setLoadingPromos] = useState(false);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [ruletaResult, setRuletaResult] = useState(null);

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

    // Estado para registros (últimas tiradas)
    const [registros, setRegistros] = useState([]);
    const [loadingRegistros, setLoadingRegistros] = useState(false);
    const [page, setPage] = useState(0);

    // Función para obtener registros
    const fetchRegistros = async () => {
        setLoadingRegistros(true);
        try {
            const res = await fetch(`${API_URL}/registros?skip=${page * 10}&limit=10`, {
                headers: { "X-Admin-Token": adminToken }
            });
            if (!res.ok) throw new Error("Error al cargar registros");
            const data = await res.json();
            setRegistros(data);
        } catch (e) {
            setRegistros([]);
        }
        setLoadingRegistros(false);
    };

    // cargar promociones activas
    const fetchPromos = async () => {
        setLoadingPromos(true);
        const res = await fetch(`${API_URL}/promociones?activas_solo=true`);
        const data = await res.json();
        setPromos(data);
        setLoadingPromos(false);
    };

    useEffect(() => {
        if (view !== "admin") fetchPromos();
    }, [view]);

    // Cargar registros cuando adminToken y page cambian
    useEffect(() => {
        if (view === "admin" && adminToken) {
            fetchRegistros();
        }
        // eslint-disable-next-line
    }, [view, adminToken, page]);

    // Gradiente cónico según probabilidad (grises)
    const wheelGradient = useMemo(() => {
        if (!promos.length) return "#1f2937";
        let acc = 0;
        const total = promos.reduce((s, p) => s + Number(p.probabilidad), 0);
        const stops = promos.map((p, i) => {
            const start = (acc / total) * 100;
            acc += Number(p.probabilidad);
            const end = (acc / total) * 100;
            const color = p.color || ["#111827", "#1F2937", "#374151", "#4B5563", "#6B7280"][i % 5];
            return `${color} ${start}% ${end}%`;
        });
        return `conic-gradient(${stops.join(",")})`;
    }, [promos]);

    const handleRegister = async (e) => {
        e.preventDefault();
        // Get Colombia current time as ISO-like string in Colombia timezone
        const colombiaNow = new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" });
        const body = { ...form, fecha_registro: colombiaNow };
        const res = await fetch(`${API_URL}/clientes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            alert("Error registrando cliente");
            return;
        }
        const data = await res.json();
        setCliente(data);
        setView("ruleta");
    };

    const spin = async () => {
        if (!cliente || !promos.length || isSpinning) return;
        // Check if device already spun in the last 2 days
        const lastSpin = localStorage.getItem("lastSpinTimestamp");
        if (lastSpin) {
            const twoDays = 2 * 24 * 60 * 60 * 1000; // 2 días en ms
            const now = Date.now();
            if (now - parseInt(lastSpin, 10) < twoDays) {
                alert("Solo puedes girar una vez cada 2 días en este dispositivo.");
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
            alert("No se pudo girar la ruleta");
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
                    <div className="flex items-center gap-3">
                        {cliente && (
                            <button
                                onClick={() => setView(view === "admin" ? "ruleta" : "admin")}
                                className="p-2 rounded-lg hover:bg-neutral-800 transition"
                                title="Panel Admin"
                            >
                                <Settings className="w-6 h-6 text-gray-300" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {view === "register" && (
                    <div className="bg-black/30 rounded-2xl p-8 border border-neutral-800">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white">Únete al Underground</h2>
                            <p className="text-gray-400 mt-2">Regístrate y gira la ruleta por increíbles premios</p>
                        </div>

                        <form onSubmit={handleRegister} className="max-w-md mx-auto space-y-6">
                            <div>
                                <label className="block text-gray-300 font-semibold mb-2">
                                    <User className="inline w-5 h-5 mr-2" />
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.nombre_completo}
                                    onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 focus:outline-none text-white placeholder-gray-500"
                                    placeholder="Tu nombre completo..."
                                />
                            </div>

                            <div>
                                <label className="block text-gray-300 font-semibold mb-2">
                                    <Zap className="inline w-5 h-5 mr-2" />
                                    Semestre Actual
                                </label>
                                <select
                                    required
                                    value={form.semestre}
                                    onChange={(e) => setForm({ ...form, semestre: e.target.value })}
                                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 focus:outline-none text-white"
                                >
                                    <option value="">Selecciona tu semestre</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                                        <option key={s} value={`${s}° Semestre`}>{s}° Semestre</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-3 px-6 rounded-lg font-bold transition-all shadow"
                            >
                                Entrar al Underground 🎭
                            </button>
                        </form>
                    </div>
                )}

                {view === "ruleta" && (
                    <div className="space-y-8">
                        <div className="bg-black/30 rounded-2xl p-6 border border-neutral-800 text-center">
                            <h2 className="text-2xl font-bold">¡Bienvenido, {cliente?.nombre_completo}! 🎭</h2>
                            <p className="text-gray-400">Gira la ruleta y descubre tu premio</p>
                        </div>

                        <div className="bg-black/30 rounded-2xl p-8 border border-neutral-800">
                            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                                {/* Ruleta y flecha */}
                                <div className="relative w-80 h-80 flex-shrink-0">
                                    {/* Flecha grande visible arriba */}
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                                        <div
                                            style={{
                                                width: 0,
                                                height: 0,
                                                borderLeft: "22px solid transparent",
                                                borderRight: "22px solid transparent",
                                                borderTop: "38px solid #fff",
                                            }}
                                        />
                                    </div>
                                    {/* Ruleta */}
                                    <div
                                        className="w-80 h-80 rounded-full border-8 border-neutral-700 shadow-2xl relative overflow-hidden"
                                        style={{
                                            background: wheelGradient,
                                            transform: `rotate(${rotation}deg)`,
                                            transition: isSpinning ? "transform 3s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
                                        }}
                                    >
                                        {/* Centro (clickeable para girar) */}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={!isSpinning ? spin : undefined}
                                            onKeyDown={(e) => {
                                                if (!isSpinning && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    spin();
                                                }
                                            }}
                                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-neutral-950 rounded-full border-4 border-neutral-600 flex items-center justify-center z-10 select-none ${
                                                isSpinning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-gray-400'
                                            }`}
                                            aria-label="Girar ruleta"
                                        >
                                            <Coffee className="w-8 h-8 text-gray-300" />
                                        </div>
                                    </div>
                                </div>
                                {/* Leyenda de promos */}
                                <div className="flex flex-col gap-3 w-full max-w-xs mt-8 md:mt-0">
                                    <h4 className="text-lg font-semibold mb-2 text-white">Premios:</h4>
                                    <div className="flex flex-col gap-2">
                                        {promos.map((p) => (
                                            <div key={p.id} className="flex items-center gap-3">
                                                <div
                                                    className="w-4 h-4 rounded-sm border border-neutral-700"
                                                    style={{ background: p.color }}
                                                />
                                                <span className="text-white">{p.nombre}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-8">
                                <button
                                    onClick={spin}
                                    disabled={isSpinning}
                                    className={`px-8 py-4 rounded-full font-bold text-lg transition ${isSpinning ? "bg-neutral-700 cursor-not-allowed" : "bg-neutral-800 hover:bg-neutral-700"
                                        }`}
                                >
                                    {isSpinning ? (
                                        <>
                                            <RotateCcw className="inline w-6 h-6 mr-2 animate-spin" />
                                            Girando...
                                        </>
                                    ) : (
                                        <>
                                            <Gift className="inline w-6 h-6 mr-2" />
                                            ¡Girar Ruleta!
                                        </>
                                    )}
                                </button>
                            </div>
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
                                        setView("register");
                                        setCliente(null);
                                        setForm({ nombre_completo: "", semestre: "" });
                                        // Do not reset the globalHasSpun flag; user cannot spin again on this device
                                    }}
                                    className="mt-6 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-semibold"
                                >
                                    Nuevo Juego 🎲
                                </button>
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
                                            alert("Contraseña incorrecta");
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
                                                    if (!res.ok) { alert("Error creando promoción"); return; }
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
                                                            <EditRow
                                                                promo={p}
                                                                onCancel={() => setEditing(null)}
                                                                onSave={async (data) => {
                                                                    const res = await fetch(`${API_URL}/promociones/${p.id}`, {
                                                                        method: "PUT",
                                                                        headers: { "Content-Type": "application/json", "X-Admin-Token": adminToken },
                                                                        body: JSON.stringify(data),
                                                                    });
                                                                    if (!res.ok) { alert("Error actualizando"); return; }
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
                                                                            if (!res.ok) { alert("Error eliminando"); return; }
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
