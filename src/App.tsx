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

      // Actualizamos el estado interno con la respuesta del director del mundo
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
    <div style={{ minHeight: '100vh', background: '#0a0510', color: '#e2e8f0', padding: '40px 30px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Cabecera Principal */}
        <header style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '1px solid #2e1065', paddingBottom: '30px' }}>
          <h1 style={{ 
            color: '#e879f9', 
            fontSize: '3.5rem', 
            margin: '0 0 15px 0', 
            textShadow: '0 0 15px #a855f7, 0 0 35px rgba(168, 85, 247, 0.7), 0 0 60px rgba(147, 51, 234, 0.5)',
            letterSpacing: '2px'
          }}>
            CYBERSIM
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.2rem', margin: '10px 0' }}>
            Plataforma interactiva de entrenamiento práctico mediante escenarios y roles reales.
          </p>
          <small style={{ color: '#4ade80', fontSize: '1rem', textShadow: '0 0 8px rgba(74, 222, 128, 0.4)' }}>
            Creado por: <strong>damoclest</strong>
          </small>
        </header>

        {/* Biografía / Acerca de la página */}
        <div style={{ background: '#12071f', border: '1px solid #7e22ce', padding: '30px', borderRadius: '12px', marginBottom: '40px', boxShadow: '0 0 25px rgba(126, 34, 206, 0.2)' }}>
          <h3 style={{ color: '#4ade80', marginTop: 0, textShadow: '0 0 8px rgba(74, 222, 128, 0.3)', fontSize: '1.4rem' }}>
            ℹ️ ¿Para qué sirve CyberSim?
          </h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.8', margin: '0 0 15px 0', fontSize: '15px' }}>
            <strong>CyberSim</strong> transforma el aprendizaje técnico en una experiencia inmersiva basada en simuladores y mundos virtuales dinámicos. Olvídate de los exámenes estáticos y cuestionarios tradicionales: aquí asumes roles profesionales reales (analista, ingeniero, desarrollador), tomas decisiones tácticas y observas consecuencias directas en entornos complejos.
          </p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>
            Cada simulación cuenta con un motor de Inteligencia Artificial dual que adapta la dificultad, genera eventos en tiempo real e integra la teoría exactamente cuando resulta relevante para tu progreso.
          </p>
        </div>

        {/* Buscador de Tema */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
          <input
            type="text"
            value={temaInput}
            onChange={(e) => setTemaInput(e.target.value)}
            placeholder="Introduce un tema o reto (Ej. Ciberseguridad, React, Conteo de cartas, Redes...)"
            style={{
              flex: 1,
              padding: '16px 22px',
              fontSize: '16px',
              background: '#12071f',
              border: '1px solid #7e22ce',
              borderRadius: '10px',
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
              padding: '16px 32px',
              background: '#9333ea',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
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
          <div style={{ background: '#450a0a', color: '#fca5a5', padding: '18px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #991b1b', fontSize: '15px' }}>
            {error}
          </div>
        )}

        {/* Contenido Principal de la Simulación Activa */}
        {datosActuales && (
          <div style={{ background: '#130822', border: '1px solid #7e22ce', padding: '35px', borderRadius: '14px', marginBottom: '40px', boxShadow: '0 0 35px rgba(126, 34, 206, 0.25)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ color: '#f0abfc', marginTop: 0, fontSize: '2.2rem', marginBottom: '10px' }}>{datosActuales.titulo}</h2>
                <span style={{ background: '#2e1065', color: '#e879f9', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>
                  Rol: {datosActuales.rol_usuario}
                </span>
              </div>
              <span style={{ background: '#064e3b', color: '#4ade80', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', border: '1px solid #047857' }}>
                Nivel: {datosActuales.nivel}
              </span>
            </div>
            
            <h3 style={{ color: '#c084fc', borderBottom: '1px solid #2e1065', paddingBottom: '8px', marginTop: '25px', fontSize: '1.3rem' }}>📖 Resumen del Escenario</h3>
            <p style={{ lineHeight: '1.8', color: '#cbd5e1', fontSize: '15px' }}>{datosActuales.resumen_conceptual}</p>

            <h3 style={{ color: '#c084fc', borderBottom: '1px solid #2e1065', paddingBottom: '8px', marginTop: '30px', fontSize: '1.3rem' }}>🎯 Objetivo Final</h3>
            <p style={{ lineHeight: '1.6', color: '#4ade80', fontSize: '15px', fontWeight: 'bold' }}>{datosActuales.objetivo_final}</p>

            {/* Consola del Mundo */}
            <div style={{ marginTop: '35px', padding: '30px', background: '#090314', borderRadius: '12px', border: '1px solid #581c87', boxShadow: 'inset 0 0 20px rgba(88, 28, 135, 0.3)' }}>
              
              <h3 style={{ marginTop: 0, color: '#e879f9', textShadow: '0 0 10px rgba(232, 121, 249, 0.3)', fontSize: '1.4rem' }}>
                🕹️ Consola de Simulación Activa
              </h3>
              
              <div style={{ marginBottom: '20px', background: '#170b2c', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #a855f7' }}>
                <p style={{ margin: '0 0 10px 0', color: '#f8fafc', fontSize: '15px', lineHeight: '1.6' }}>
                  <strong>Narración:</strong> {datosActuales.estado_inicial?.narracion}
                </p>
                <p style={{ margin: 0, color: '#d8b4fe', fontSize: '15px', lineHeight: '1.6' }}>
                  <strong>Situación actual:</strong> {datosActuales.estado_inicial?.situacion}
                </p>
              </div>

              {/* Si hay enseñanza teórica contextual */}
              {datosActuales.ultima_ensenanza && datosActuales.ultima_ensenanza.mostrar && (
                <div style={{ marginBottom: '20px', background: '#022c22', border: '1px solid #10b981', padding: '20px', borderRadius: '8px', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#4ade80', fontSize: '1.1rem' }}>
                    🧠 Concepto Aplicado: {datosActuales.ultima_ensenanza.titulo}
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>
                    {datosActuales.ultima_ensenanza.explicacion}
                  </p>
                </div>
              )}

              <p style={{ marginBottom: '15px', color: '#cbd5e1', fontWeight: 'bold', fontSize: '15px' }}>Acciones sugeridas del mundo:</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                {datosActuales.estado_inicial?.acciones_posibles?.map((accion: any, idx: number) => (
                  <button
                    key={accion.id || idx}
                    onClick={() => enviarAccion(accion.nombre || accion.descripcion)}
                    disabled={cargando}
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      background: '#12071f',
                      border: '1px solid #7e22ce',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#f8fafc',
                      fontFamily: 'monospace',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 10px rgba(126, 34, 206, 0.15)'
                    }}
                  >
                    <strong style={{ color: '#e879f9', display: 'block', marginBottom: '5px' }}>{accion.nombre}</strong>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{accion.descripcion}</span>
                  </button>
                ))}
              </div>

              {/* Entrada de acción libre por texto */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <input
                  type="text"
                  value={accionInput}
                  onChange={(e) => setAccionInput(e.target.value)}
                  placeholder="O escribe tu propia acción libre dentro del simulador..."
                  style={{
                    flex: 1,
                    padding: '14px 18px',
                    fontSize: '14px',
                    background: '#12071f',
                    border: '1px solid #7e22ce',
                    borderRadius: '8px',
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
                    padding: '14px 24px',
                    background: '#7e22ce',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
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
          <div style={{ background: '#12071f', border: '1px solid #4c1d95', padding: '25px', borderRadius: '12px' }}>
            <h3 style={{ color: '#c084fc', marginTop: 0, fontSize: '1.2rem' }}>📂 Historial de Simulaciones</h3>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {historial.map((item, idx) => (
                <li key={idx} style={{ cursor: 'pointer', color: '#e879f9', fontSize: '15px' }} onClick={() => { setDatosActuales(item); }}>
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
