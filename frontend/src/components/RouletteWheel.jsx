import React from 'react';

export default function RouletteWheel({ promos, isSpinning, rotation, onSpin }) {
  const wheelGradient = React.useMemo(() => {
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

  return (
    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
      {/* Ruleta y flecha */}
      <div className="relative w-80 h-80 flex-shrink-0">
        {/* Puntero: triángulo blanco apuntando hacia abajo, mitad dentro/mitad fuera */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-white" />
        </div>
        {/* Rueda */}
        <div
          className="w-80 h-80 rounded-full border-8 border-neutral-700 shadow-inner select-none"
          style={{ background: wheelGradient, transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3s ease-out' : 'none' }}
        ></div>
        {/* Botón central */}
        <div
          onClick={() => { if (!isSpinning) onSpin?.(); }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-neutral-950 rounded-full border-4 border-neutral-600 flex items-center justify-center z-10 select-none ${
            isSpinning ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:border-gray-400'
          }`}
          aria-label="Girar ruleta"
        >
          <span role="img" aria-label="café">☕</span>
        </div>
      </div>
      {/* Leyenda de promos */}
      <div className="flex flex-col gap-3 w-full max-w-xs mt-8 md:mt-0">
        <h4 className="text-lg font-semibold mb-2 text-white">Premios:</h4>
        <div className="flex flex-col gap-2">
          {promos.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-sm border border-neutral-700" style={{ background: p.color }} />
              <span className="text-white">{p.nombre}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
