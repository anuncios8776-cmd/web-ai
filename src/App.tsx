import React, { useState, useEffect } from 'react';

interface Etapa {
  id: number;
  titulo: string;
  contexto: string;
  objetivo: string;
  acciones_sugeridas: Array<{
    id: string;
    texto: string;
    tipo: string;
    consecuencia_si_se_ejecuta: string;
    concepto_ensenado: string;
  }>;
  respuesta_a_accion: {
    exito: string;
    error: string;
    explicacion: string;
  };
}

interface SimulacionCompleta {
  tipo: string;
  rol_usuario: string;
  introduccion: string;
  objetivo_final: string;
  etapas: Etapa[];
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
  minijuego: SimulacionCompleta;
}

export default function App() {
  const [temaInput, setTemaInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [datosActuales, setDatosActuales] = useState<TemaData | null>(null);
  const [historial, setHistorial] = useState<TemaData[]>([]);
  const [etapaActualIndex, setEtapaActualIndex] = useState(0);
  const [accionSeleccionada, setAccionSeleccionada] = useState<string | null>(null);
  const [resultadoAccion, setResultadoAccion] = useState<boolean | null>(null);
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
    setEtapaActualIndex(0);
    setAccionSeleccionada(null);
    setResultadoAccion(null);

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

  const ejecutarAccion = (textoAccion: string, idx: number) => {
    setAccionSeleccionada(textoAccion);
    // Evaluamos de forma simulada si es la primera opción óptima o requiere aprendizaje
    const esExito = idx === 0; 
    setResultadoAccion(esExito);
  };

  const siguienteEtapa = () => {
    if (!datosActuales) return;
    if (etapaActualIndex < datosActuales.minijuego.etapas.length - 1) {
      setEtapaActualIndex(prev => prev + 1);
      setAccionSeleccionada(null);
      setResultadoAccion(null);
    }
  };

  const etapaActiva = datosActuales?.minijuego.etapas[etapaActualIndex];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0510', color: '#e2e8f0', padding: '30px 20px', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Cabecera con Título más Grande y Sombreado Neón Morado */}
        <header style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '1px solid #2e1065', paddingBottom: '20px' }}>
          <h1 style={{ 
            color: '#e879f9', 
            fontSize: '3.2rem', 
            margin: '0 0 10px 0', 
            textShadow: '0 0 15px #a855f7, 0 0 35px rgba(168, 85, 247, 0.7), 0 0 60px rgba(147, 51, 234, 0.5)',
            letterSpacing: '2px'
          }}>
            CYBERSIM
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', margin: '5px 0' }}>
            Plataforma interactiva de entrenamiento práctico mediante escenarios y roles reales.
          </p>
          <small style={{ color: '#c084fc', fontSize: '0.9rem' }}>Creado por: <strong>damoclest</strong></small>
        </header>

        {/* Biografía / Acerca de la página */}
        <div style={{ background: '#12071f', border: '1px solid #7e22ce', padding: '20px', borderRadius: '10px', marginBottom: '30px', boxShadow: '0 0 20px rgba(126, 34, 206, 0.2)' }}>
          <h3 style={{ color: '#e879f9', marginTop: 0, textShadow: '0 0 8px rgba(232, 121, 249, 0.4)' }}>ℹ️ ¿Para qué sirve CyberSim?</h3>
          <p style={{ color: '#cbd5e1', lineHeight: '1.7', margin: '0 0 10px 0', fontSize: '14px' }}>
            <strong>CyberSim</strong> transforma la educación técnica en una experiencia inmersiva basada en videojuegos de simulación. En lugar de responder exámenes estáticos, asumes roles profesionales (como ingeniero, analista o desarrollador) y tomas decisiones en múltiples etapas guiadas. Cada acción modifica el estado del entorno y enseña conceptos complejos a través de consecuencias reales.
          </p>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>
            Diseñado e implementado con arquitecturas de Inteligencia Artificial dual para garantizar rigor técnico y aprendizaje activo.
          </p>
        </div>

        {/* Buscador de Tema */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '35px' }}>
          <input
            type="text"
            value={temaInput}
            onChange={(e) => setTemaInput(e.target.value)}
            placeholder="Introduce un tema o reto (Ej. Ciberseguridad, React, Conteo de cartas...)"
            style={{
              flex: 1,
              padding: '14px 18px',
              fontSize: '15px',
              background: '#12071f',
              border: '1px solid #7e22ce',
              borderRadius: '8px',
              color: '#f8fafc',
              outline: 'none',
              boxShadow: '0 0 12px rgba(126, 34, 206, 0.25)'
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
              boxShadow: '0 0 18px rgba(147, 51, 234, 0.6)',
              transition: 'all 0.2s ease'
            }}
          >
            {cargando ? 'Generando simulación...' : 'Iniciar Experiencia'}
          </button>
        </form>

        {error && (
          <div style={{ background: '#450a0a', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '25px', border: '1px solid #991b1b' }}>
            {error}
          </div>
        )}

        {/* Contenido principal de la Simulación */}
        {datosActuales && (
          <div style={{ background: '#130822', border: '1px solid #7e22ce', padding: '30px', borderRadius: '12px', marginBottom: '40px', boxShadow: '0 0 30px rgba(126, 34, 206, 0.2)' }}>
            
            <h2 style={{ color: '#f0abfc', marginTop: 0, fontSize: '2rem' }}>{datosActuales.titulo}</h2>
            
            <h3 style={{ color: '#c084fc', borderBottom: '1px solid #2e1065', paddingBottom: '5px' }}>📖 Resumen Conceptual</h3>
            <p style={{ lineHeight: '1.7', color: '#cbd5e1' }}>{datosActuales.resumen_conceptual}</p>

            <h3 style={{ color: '#c084fc', borderBottom: '1px solid #2e1065', paddingBottom: '5px', marginTop: '25px' }}>📚 Lecturas Clave</h3>
            <ul style={{ paddingLeft: '20px', color: '#cbd5e1' }}>
              {datosActuales.libros_recomendados?.map((libro, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#e879f9' }}>{libro.titulo}</strong> — <em style={{ color: '#94a3b8' }}>{libro.autor}</em> <br />
                  <small style={{ color: '#64748b' }}>{libro.por_que_leerlo}</small>
                </li>
              ))}
            </ul>

            {/* Consola Interactiva por Etapas */}
            {etapaActiva && (
              <div style={{ marginTop: '35px', padding: '25px', background: '#090314', borderRadius: '10px', border: '1px solid #581c87', boxShadow: 'inset 0 0 15px rgba(88, 28, 135, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ margin: 0, color: '#e879f9', textShadow: '0 0 10px rgba(232, 121, 249, 0.3)' }}>
                    🕹️ Etapa {etapaActualIndex + 1} de {datosActuales.minijuego.etapas.length}: {etapaActiva.titulo}
                  </h3>
                  <span style={{ background: '#2e1065', color: '#d8b4fe', padding: '4px 10px', borderRadius: '4px', fontSize: '12px' }}>
                    Rol: {datosActuales.minijuego.rol_usuario}
                  </span>
                </div>
                
                <div style={{ marginBottom: '15px', background: '#170b2c', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #a855f7' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#f8fafc' }}><strong>Contexto:</strong> {etapaActiva.contexto}</p>
                  <p style={{ margin: 0, color: '#d8b4fe' }}><strong>Objetivo de etapa:</strong> {etapaActiva.objetivo}</p>
                </div>

                <p style={{ marginBottom: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>Elige tu acción táctica:</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {etapaActiva.acciones_sugeridas?.map((accion, idx) => {
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

                    if (accionSeleccionada === accion.texto) {
                      estiloBoton.background = resultadoAccion ? '#022c22' : '#450a0a';
                      estiloBoton.border = resultadoAccion ? '1px solid #10b981' : '1px solid #ef4444';
                    }

                    return (
                      <button key={accion.id || idx} onClick={() => ejecutarAccion(accion.texto, idx)} style={estiloBoton}>
                        {accion.texto}
                      </button>
                    );
                  })}
                </div>

                {resultadoAccion !== null && (
                  <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    background: '#12071f',
                    borderRadius: '8px',
                    border: '1px solid #a855f7',
                    boxShadow: '0 0 15px rgba(168, 85, 247, 0.15)'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#e879f9', fontSize: '1.1rem' }}>
                      ⚡ Consecuencia de la Acción:
                    </h4>
                    <p style={{ margin: '5px 0', color: '#e2e8f0' }}>{etapaActiva.respuesta_a_accion.explicacion}</p>
                    
                    {etapaActualIndex < datosActuales.minijuego.etapas.length - 1 ? (
                      <button
                        onClick={siguienteEtapa}
                        style={{
                          marginTop: '15px',
                          padding: '10px 20px',
                          background: '#9333ea',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Avanzar a la Siguiente Etapa ➔
                      </button>
                    ) : (
                      <p style={{ marginTop: '15px', color: '#4ade80', fontWeight: 'bold' }}>
                        🎉 ¡Has completado todas las etapas de esta simulación con éxito!
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div style={{ background: '#12071f', border: '1px solid #4c1d95', padding: '20px', borderRadius: '10px' }}>
            <h3 style={{ color: '#c084fc', marginTop: 0 }}>📂 Historial de Simulaciones</h3>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {historial.map((item, idx) => (
                <li key={idx} style={{ cursor: 'pointer', color: '#e879f9', marginBottom: '8px' }} onClick={() => { setDatosActuales(item); setEtapaActualIndex(0); setAccionSeleccionada(null); setResultadoAccion(null); }}>
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
