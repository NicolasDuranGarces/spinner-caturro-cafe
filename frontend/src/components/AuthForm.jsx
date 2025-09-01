import React from 'react';

export default function AuthForm({ mode, setMode, values, setValues, onLogin, onRegister, loading = false }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'register') await onRegister(values);
    else await onLogin({ cedula: values.cedula, password: values.password });
  };

  return (
    <div className="bg-black/30 rounded-2xl p-8 border border-neutral-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">Puntos Caturro</h2>
        <p className="text-gray-400 mt-2">Regístrate o inicia sesión con tu cédula</p>
      </div>
      <div className="flex justify-center mb-6 gap-2">
        <button className={`px-4 py-2 rounded ${mode === 'login' ? 'bg-neutral-800' : 'bg-neutral-900 border border-neutral-700'}`} onClick={() => setMode('login')}>Iniciar sesión</button>
        <button className={`px-4 py-2 rounded ${mode === 'register' ? 'bg-neutral-800' : 'bg-neutral-900 border border-neutral-700'}`} onClick={() => setMode('register')}>Registrarse</button>
      </div>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Cédula</label>
          <input type="text" required value={values.cedula} onChange={(e)=>setValues({ ...values, cedula: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 focus:outline-none text-white placeholder-gray-500" placeholder="Tu cédula" />
        </div>
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Contraseña</label>
          <input type="password" required value={values.password} onChange={(e)=>setValues({ ...values, password: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 focus:outline-none text-white placeholder-gray-500" placeholder="Tu contraseña" />
        </div>
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Nombre Completo</label>
              <input type="text" required value={values.nombre_completo} onChange={(e)=>setValues({ ...values, nombre_completo: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 focus:outline-none text-white placeholder-gray-500" placeholder="Tu nombre completo" />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Semestre</label>
              <select required value={values.semestre} onChange={(e)=>setValues({ ...values, semestre: e.target.value })} className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg focus:border-gray-400 focus:outline-none text-white">
                <option value="">Selecciona tu semestre</option>
                {[1,2,3,4,5,6,7,8,9,10].map(s => (
                  <option key={s} value={`${s}° Semestre`}>{s}° Semestre</option>
                ))}
              </select>
            </div>
          </>
        )}
        <button type="submit" disabled={loading} className="w-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-white py-3 px-6 rounded-lg font-bold transition-all shadow">
          {mode === 'register' ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}

