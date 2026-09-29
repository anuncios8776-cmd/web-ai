import React, { useState, useEffect } from 'react';

interface Simulacion {
  tipo: string;
  rol_usuario: string;
  contexto_escenario: string;
  reto: string;
  opciones: string[];
  respuesta_correcta: string;
  consecuencia_exito: string;
  explicacion_teorica: string;
}

interface Libro {
  titulo: string;
  autor: string;
  por_que_leerlo: string;
}

interface TemaData {
  titulo: string;
  resumen_conceptual: string;
  libros_recomendados: Libro[];
  minijuego: Simulacion;
}

export default function App() {
  const [temaInput, setTemaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [datosActuales, setDatosActuales] = useState<TemaData | null>(null);
  const [historial, setHistorial] = useState<TemaData[]>([]);
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<string | null>(null);
  const [resultadoSimulacion, setResultadoSimulacion] = useState<boolean | null>(null);
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
    setOpcionSeleccionada(null);
    setResultadoSimulacion(null);

    try {
      const response = await fetch('/api/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: temaInput }),
      });

      const textoRespuesta = await response.text();
      let resultado;

      try {
        resultado = JSON.parse(textoRespuesta);
      } catch {
        throw new Error(`Respuesta no válida del servidor: ${textoRespuesta.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(resultado.error || 'Error al procesar la solicitud');
      }

      setDatosActuales(resultado);
      setHistorial((prev) => [resultado, ...prev]);
      setTemaInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  const tomarDecision = (opcion: string) => {
    setOpcionSeleccionada(opcion);
    if (!datosActuales) return;

    const esCorrecta = opcion.trim().toLowerCase() === datosActuales.minijuego.respuesta_correcta.trim().toLowerCase();
    setResultadoSimulacion(esCorrecta);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0510', color: '#e2e8f0', padding: '30px 20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Cabecera con Sombreado Verde Neón */}
        <header style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #2e1065', paddingBottom: '20px' }}>
          <h1 style={{ 
            color: '#4ade80', 
            fontSize: '2.5rem', 
            margin: '0 0 10px 0', 
            textShadow: '0 0 10px #4ade80, 0 0 25px rgba(74, 222, 128, 0.6), 0 0 40px rgba(74, 222, 128, 0.3)' 
          }}>
            ⚡ CYBERSIM // SIMULADOR TÉCNICO
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: '5px 0' }}>
            Plataforma de entrenamiento de decisiones críticas impulsada por IA Dual.
          </p>
          <small style={{ color: '#c084fc' }}>Desarrollado por: <strong>damoclest</strong></small>
        </header>

        {/* Sección de Biografía / Acerca de la página */}
        <div style={{ background: '#12071f', border: '1px solid #7e22ce', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 0 15px rgba(126, 34, 206, 0.15)' }}>
          <h3 style={{ color: '#4ade80', marginTop: 0, textShadow: '0 0 8px rgba(74, 222, 128, 0.3)' }}>ℹ️ ¿Para qué sirve CyberSim?</h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 10px 0', fontSize: '14px' }}>
            <strong>CyberSim</strong> es un entorno interactivo diseñado para ingenieros, desarrolladores y entusiastas de la tecnología que buscan dominar conceptos complejos mediante la práctica simulada. En lugar de memorizar teoría pasiva, aquí asumes roles profesionales reales (como analista de sistemas, auditor de ciberseguridad o arquitecto de software) y resuelves dilemas técnicos mediante toma de decisiones estratégicas.
          </p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>
            Cada simulación es generada dinámicamente y validada por sistemas de Inteligencia Artificial avanzados para garantizar rigor técnico y aprendizaje profundo.
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '35px' }}>
          <input
            type="text"
            value={temaInput}
            onChange={(e) => setTemaInput(e.target.value)}
            placeholder="Introduce tema de estudio o incidente (Ej. Ciberseguridad, Redes, React...)"
            style={{
              flex: 1,
              padding: '14px 18px',
              fontSize: '15px',
              background: '#12071f',
              border: '1px solid #7e22ce',
              borderRadius: '8px',
              color: '#f8fafc',
              outline: 'none',
              boxShadow: '0 0 10px rgba(126, 34, 206, 0.2)'
            }}
            disabled={cargando}
          />
          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: '14px 28px',
              background: '#9333ea',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
              boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)',
              transition: 'all 0.2s ease'
            }}
          >
            {cargando ? 'Generando...' : 'Iniciar Simulación'}
          </button>
        </form>

        {error && (
          <div style={{ background: '#450a0a', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #991b1b' }}>
            {error}
          </div>
        )}

        {/* Contenido principal generado */}
        {datosActuales && (
          <div style={{ background: '#130822', border: '1px solid #7e22ce', padding: '30px', borderRadius: '12px', marginBottom: '40px', boxShadow: '0 0 25px rgba(126, 34, 206, 0.15)' }}>
            
            <h2 style={{ color: '#e879f9', marginTop: 0, fontSize: '1.8rem' }}>{datosActuales.titulo}</h2>
            
            <h3 style={{ color: '#a855f7', borderBottom: '1px solid #2e1065', paddingBottom: '5px' }}>📖 Resumen Conceptual</h3>
            <p style={{ lineHeight: '1.7', color: '#cbd5e1' }}>{datosActuales.resumen_conceptual}</p>

            <h3 style={{ color: '#a855f7', borderBottom: '1px solid #2e1065', paddingBottom: '5px', marginTop: '25px' }}>📚 Lecturas Clave</h3>
            <ul style={{ paddingLeft: '20px', color: '#cbd5e1' }}>
              {datosActuales.libros_recomendados?.map((libro, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#f472b6' }}>{libro.titulo}</strong> — <em style={{ color: '#94a3b8' }}>{libro.autor}</em> <br />
                  <small style={{ color: '#64748b' }}>{libro.por_que_leerlo}</small>
                </li>
              ))}
            </ul>

            {/* Consola de la Simulación */}
            <div style={{ marginTop: '35px', padding: '25px', background: '#090314', borderRadius: '10px', border: '1px solid #4c1d95' }}>
              <h3 style={{ marginTop: 0, color: '#4ade80', textShadow: '0 0 10px rgba(74, 222, 128, 0.3)' }}>
                💻 Consola de Simulación de Incidente
              </h3>
              
              <div style={{ marginBottom: '15px', background: '#170b2c', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #a855f7' }}>
                <p style={{ margin: '0 0 5px 0' }}><strong style={{ color: '#c084fc' }}>Rol Asignado:</strong> {datosActuales.minijuego.rol_usuario}</p>
                <p style={{ margin: 0 }}><strong style={{ color: '#c084fc' }}>Escenario:</strong> {datosActuales.minijuego.contexto_escenario}</p>
              </div>

              <p style={{ fontWeight: 'bold', color: '#4ade80', background: '#064e3b', padding: '12px', borderRadius: '6px', border: '1px solid #047857' }}>
                🎯 RETO TÉCNICO: {datosActuales.minijuego.reto}
              </p>

              <p style={{ marginBottom: '10px', color: '#cbd5e1' }}>Selecciona tu línea de acción:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {datosActuales.minijuego.opciones?.map((opcion, idx) => {
                  let estiloBoton: React.CSSProperties = {
                    padding: '14px 18px',
                    textAlign: 'left',
                    background: '#12071f',
                    border: '1px solid #7e22ce',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    transition: 'all 0.2s'
                  };

                  if (opcionSeleccionada === opcion) {
                    const esAcierto = opcion === datosActuales.minijuego.respuesta_correcta;
                    estiloBoton.background = esAcierto ? '#064e3b' : '#7f1d1d';
                    estiloBoton.border = esAcierto ? '1px solid #4ade80' : '1px solid #f87171';
                    estiloBoton.color = '#fff';
                  }

                  return (
                    <button key={idx} onClick={() => tomarDecision(opcion)} style={estiloBoton}>
                      {opcion}
                    </button>
                  );
                })}
              </div>

              {resultadoSimulacion !== null && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  background: resultadoSimulacion ? '#022c22' : '#450a0a',
                  borderRadius: '8px',
                  border: resultadoSimulacion ? '1px solid #10b981' : '1px solid #ef4444',
                  boxShadow: resultadoSimulacion ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(239, 68, 68, 0.2)'
                }}>
                  <h4 style={{ margin: '0 0 8px 0', color: resultadoSimulacion ? '#4ade80' : '#f87171', fontSize: '1.1rem' }}>
                    {resultadoSimulacion ? '⚡ [ACCIÓN EXITOSA: SISTEMA ESTABILIZADO]' : '💥 [FALLO CRÍTICO: BRECHA DETECTADA]'}
                  </h4>
                  <p style={{ margin: '5px 0', color: '#e2e8f0' }}><strong>Impacto:</strong> {datosActuales.minijuego.consecuencia_exito}</p>
                  <p style={{ margin: '10px 0 0 0', color: '#94a3b8' }}><strong>Fundamento Técnico:</strong> {datosActuales.minijuego.explicacion_teorica}</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div style={{ background: '#12071f', border: '1px solid #4c1d95', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ color: '#c084fc', marginTop: 0 }}>📂 Historial de Simulaciones</h3>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {historial.map((item, idx) => (
                <li key={idx} style={{ cursor: 'pointer', color: '#38bdf8', marginBottom: '8px' }} onClick={() => setDatosActuales(item)}>
                  {item.titulo}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
