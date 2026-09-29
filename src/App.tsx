import React, { useState, useEffect } from 'react';

export default function App() {
  const [temaInput, setTemaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [datosActuales, setDatosActuales] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [accionInput, setAccionInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/index')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHistorial(data);
      })
      .catch((err) => console.error('Error cargando historial:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!temaInput.trim()) return;

    setCargando(true);
    setError(null);

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: temaInput }),
      });

      const resultado = await response.json();
      if (!response.ok) throw new Error(resultado.error || 'Error al iniciar simulación');

      setDatosActuales(resultado);
      setHistorial((prev) => [resultado, ...prev]);
      setTemaInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const enviarAccion = async (textoAccion: string) => {
    if (!datosActuales) return;
    setCargando(true);
    setError(null);

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion_usuario: textoAccion,
          simulacion: datosActuales,
          estado_actual: datosActuales.estado_inicial,
          historial: historial
        }),
      });

      const resultadoMotor = await response.json();
      if (!response.ok) throw new Error(resultadoMotor.error || 'Error al procesar acción');

      setDatosActuales((prev: any) => ({
        ...prev,
        estado_inicial: {
          ...prev.estado_inicial,
          narracion: resultadoMotor.resultado?.narracion || '',
          situacion: resultadoMotor.resultado?.estado_situacion || '',
          acciones_posibles: resultadoMotor.siguiente_situacion?.acciones_sugeridas || []
        },
        ultima_ensenanza: resultadoMotor.ensenanza
      }));
      setAccionInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0510', color: '#e2e8f0', padding: '60px 20px', fontFamily: 'monospace', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Cabecera Principal */}
        <header style={{ textAlign: 'center', marginBottom: '50px', borderBottom: '1px solid #2e1065', paddingBottom: '35px' }}>
          <h1 style={{ 
            color: '#e879f9', 
            fontSize: '4rem', 
            margin: '0 0 15px 0', 
            textShadow: '0 0 20px #a855f7, 0 0 40px rgba(168, 85, 247, 0.7)',
            letterSpacing: '3px'
          }}>
            CYBERSIM
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.25rem', margin: '10px 0', lineHeight: '1.6' }}>
            Plataforma interactiva de entrenamiento práctico mediante escenarios y roles reales.
          </p>
          <small style={{ color: '#4ade80', fontSize: '1.05rem', textShadow: '0 0 10px rgba(74, 222, 128, 0.4)' }}>
            Creado por: <strong>damoclest</strong>
          </small>
        </header>

        {/* Sección Informativa */}
        <div style={{ background: '#12071f', border: '1px solid #7e22ce', padding: '35px', borderRadius: '16px', marginBottom: '45px', boxShadow: '0 0 30px rgba(126, 34, 206, 0.25)' }}>
          <h3 style={{ color: '#4ade80', marginTop: 0, textShadow: '0 0 8px rgba(74, 222, 128, 0.3)', fontSize: '1.5rem', marginBottom: '15px' }}>
            ℹ️ ¿Para qué sirve CyberSim?
          </h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.9', margin: '0 0 15px 0', fontSize: '16px' }}>
            <strong>CyberSim</strong> transforma el aprendizaje técnico en una experiencia inmersiva basada en simuladores y mundos virtuales dinámicos. Olvídate de los exámenes estáticos y cuestionarios tradicionales: aquí asumes roles profesionales reales (analista, ingeniero, desarrollador), tomas decisiones tácticas y observas consecuencias directas en entornos complejos.
          </p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '15px', lineHeight: '1.7' }}>
            Cada simulación cuenta con un motor de Inteligencia Artificial dual que adapta la dificultad, genera eventos en tiempo real e integra la teoría exactamente cuando resulta relevante para tu progreso.
          </p>
        </div>

        {/* Buscador de Tema */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', marginBottom: '45px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={temaInput}
            onChange={(e) => setTemaInput(e.target.value)}
            placeholder="Introduce un tema o reto (Ej. Ciberseguridad, React, Conteo de cartas, Redes...)"
            style={{
              flex: '1 1 300px',
              padding: '18px 24px',
              fontSize: '16px',
              background: '#12071f',
              border: '1px solid #7e22ce',
              borderRadius: '12px',
              color: '#f8fafc',
              outline: 'none',
              boxShadow: '0 0 15px rgba(126, 34, 206, 0.25)'
            }}
            disabled={cargando}
          />
          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: '18px 36px',
              background: '#9333ea',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              boxShadow: '0 0 20px rgba(147, 51, 234, 0.6)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {cargando ? 'Construyendo mundo...' : 'Iniciar Simulación'}
          </button>
        </form>

        {error && (
          <div style={{ background: '#450a0a', color: '#fca5a5', padding: '20px', borderRadius: '12px', marginBottom: '35px', border: '1px solid #991b1b', fontSize: '16px' }}>
            {error}
          </div>
        )}

        {/* Contenido Principal de la Simulación Activa */}
        {datosActuales && (
          <div style={{ background: '#130822', border: '1px solid #7e22ce', padding: '40px', borderRadius: '16px', marginBottom: '45px', boxShadow: '0 0 40px rgba(126, 34, 206, 0.3)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h2 style={{ color: '#f0abfc', marginTop: 0, fontSize: '2.4rem', marginBottom: '10px' }}>{datosActuales.titulo}</h2>
                <span style={{ background: '#2e1065', color: '#e879f9', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', display: 'inline-block' }}>
                  Rol: {datosActuales.rol_usuario}
                </span>
              </div>
              <span style={{ background: '#064e3b', color: '#4ade80', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', border: '1px solid #047857', height: 'fit-content' }}>
                Nivel: {datosActuales.nivel}
              </span>
            </div>
            
            <h3 style={{ color: '#c084fc', borderBottom: '1px solid #2e1065', paddingBottom: '10px', marginTop: '30px', fontSize: '1.4rem' }}>📖 Resumen del Escenario</h3>
            <p style={{ lineHeight: '1.9', color: '#cbd5e1', fontSize: '16px' }}>{datosActuales.resumen_conceptual}</p>

            <h3 style={{ color: '#c084fc', borderBottom: '1px solid #2e1065', paddingBottom: '10px', marginTop: '35px', fontSize: '1.4rem' }}>🎯 Objetivo Final</h3>
            <p style={{ lineHeight: '1.7', color: '#4ade80', fontSize: '16px', fontWeight: 'bold' }}>{datosActuales.objetivo_final}</p>

            {/* Consola del Mundo */}
            <div style={{ marginTop: '40px', padding: '35px', background: '#090314', borderRadius: '14px', border: '1px solid #581c87', boxShadow: 'inset 0 0 25px rgba(88, 28, 135, 0.3)' }}>
              
              <h3 style={{ marginTop: 0, color: '#e879f9', textShadow: '0 0 10px rgba(232, 121, 249, 0.3)', fontSize: '1.5rem', marginBottom: '20px' }}>
                🕹️ Consola de Simulación Activa
              </h3>
              
              <div style={{ marginBottom: '25px', background: '#170b2c', padding: '25px', borderRadius: '10px', borderLeft: '5px solid #a855f7' }}>
                <p style={{ margin: '0 0 12px 0', color: '#f8fafc', fontSize: '16px', lineHeight: '1.7' }}>
                  <strong>Narración:</strong> {datosActuales.estado_inicial?.narracion}
                </p>
                <p style={{ margin: 0, color: '#d8b4fe', fontSize: '16px', lineHeight: '1.7' }}>
                  <strong>Situación actual:</strong> {datosActuales.estado_inicial?.situacion}
                </p>
              </div>

              {/* Si hay enseñanza teórica contextual */}
              {datosActuales.ultima_ensenanza && datosActuales.ultima_ensenanza.mostrar && (
                <div style={{ marginBottom: '25px', background: '#022c22', border: '1px solid #10b981', padding: '25px', borderRadius: '10px', boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4ade80', fontSize: '1.2rem' }}>
                    🧠 Concepto Aplicado: {datosActuales.ultima_ensenanza.titulo}
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '15px', lineHeight: '1.7' }}>
                    {datosActuales.ultima_ensenanza.explicacion}
                  </p>
                </div>
              )}

              <p style={{ marginBottom: '18px', color: '#cbd5e1', fontWeight: 'bold', fontSize: '16px' }}>Acciones sugeridas del mundo:</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '30px' }}>
                {datosActuales.estado_inicial?.acciones_posibles?.map((accion: any, idx: number) => (
                  <button
                    key={accion.id || idx}
                    onClick={() => enviarAccion(accion.nombre || accion.descripcion)}
                    disabled={cargando}
                    style={{
                      padding: '18px 22px',
                      textAlign: 'left',
                      background: '#12071f',
                      border: '1px solid #7e22ce',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 12px rgba(126, 34, 206, 0.15)'
                    }}
                  >
                    <strong style={{ color: '#e879f9', display: 'block', marginBottom: '6px' }}>{accion.nombre}</strong>
                    <span style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>{accion.descripcion}</span>
                  </button>
                ))}
              </div>

              {/* Entrada de acción libre por texto */}
              <div style={{ display: 'flex', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={accionInput}
                  onChange={(e) => setAccionInput(e.target.value)}
                  placeholder="O escribe tu propia acción libre dentro del simulador..."
                  style={{
                    flex: '1 1 280px',
                    padding: '16px 20px',
                    fontSize: '15px',
                    background: '#12071f',
                    border: '1px solid #7e22ce',
                    borderRadius: '10px',
                    color: '#f8fafc',
                    outline: 'none'
                  }}
                  disabled={cargando}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && accionInput.trim()) {
                      e.preventDefault();
                      enviarAccion(accionInput);
                    }
                  }}
                />
                <button
                  onClick={() => { if (accionInput.trim()) enviarAccion(accionInput); }}
                  disabled={cargando || !accionInput.trim()}
                  style={{
                    padding: '16px 28px',
                    background: '#7e22ce',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Ejecutar Acción
                </button>
              </div>

            </div>

          </div>
        )}

        {/* Historial de Simulaciones */}
        {historial.length > 0 && (
          <div style={{ background: '#12071f', border: '1px solid #4c1d95', padding: '30px', borderRadius: '16px' }}>
            <h3 style={{ color: '#c084fc', marginTop: 0, fontSize: '1.3rem', marginBottom: '15px' }}>📂 Historial de Simulaciones</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {historial.map((item, idx) => (
                <li key={idx} style={{ cursor: 'pointer', color: '#e879f9', fontSize: '16px', lineHeight: '1.5' }} onClick={() => { setDatosActuales(item); }}>
                  {item.titulo} — <small style={{ color: '#94a3b8' }}>({item.tema || 'Simulación'})</small>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
